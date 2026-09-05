from django.utils import timezone
from django.db.models import Q
from rest_framework import viewsets, views, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import (
    Category, Complaint, ComplaintMedia, ComplaintStatusHistory,
    ComplaintAssignment, CitizenFeedback, ResolutionRecord
)
from .serializers import (
    CategorySerializer, ComplaintListSerializer, ComplaintDetailSerializer,
    ComplaintMediaSerializer, ComplaintStatusHistorySerializer, CitizenFeedbackSerializer
)
from apps.authentication.models import Department, CustomUser
from apps.ai_engine.models import AIPrediction, DuplicateDetectionLog
from apps.ai_engine.services import PriorityAssessmentEngine, DuplicateDetectionEngine
from apps.notifications.services import create_notification, notify_status_change
from apps.analytics.models import AuditRecord

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]


class ComplaintViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['list']:
            return ComplaintListSerializer
        return ComplaintDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Complaint.objects.select_related('category', 'department', 'citizen', 'assigned_official') \
                                    .prefetch_related('media', 'status_history', 'assignments')

        # Filter by role
        if user.role == 'CITIZEN':
            # Citizens by default can view their own complaints in detail, but list can filter to user's
            if self.request.query_params.get('my_complaints') == 'true':
                queryset = queryset.filter(citizen=user)
        elif user.role == 'OFFICIAL':
            if user.department:
                if self.request.query_params.get('department_only') == 'true':
                    queryset = queryset.filter(department=user.department)

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'ALL':
            queryset = queryset.filter(status=status_param)

        priority_param = self.request.query_params.get('priority')
        if priority_param and priority_param != 'ALL':
            queryset = queryset.filter(priority=priority_param)

        category_param = self.request.query_params.get('category')
        if category_param and category_param != 'ALL':
            queryset = queryset.filter(category_id=category_param)

        department_param = self.request.query_params.get('department')
        if department_param and department_param != 'ALL':
            queryset = queryset.filter(department_id=department_param)

        duplicate_only = self.request.query_params.get('duplicates_only')
        if duplicate_only == 'true':
            queryset = queryset.filter(is_duplicate_flag=True)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(complaint_id__icontains=search) |
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(address__icontains=search) |
                Q(landmark__icontains=search)
            )

        ordering = self.request.query_params.get('ordering', '-created_at')
        return queryset.order_by(ordering)

    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user

        category_id = data.get('category_id')
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response({'error': 'Invalid category specified'}, status=status.HTTP_400_BAD_REQUEST)

        title = data.get('title')
        description = data.get('description')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        address = data.get('address', '')
        landmark = data.get('landmark', '')
        ward_zone = data.get('ward_zone', '')
        user_severity = data.get('severity', 'MODERATE')
        is_sensitive = str(data.get('is_sensitive_location', 'false')).lower() in ['true', '1']

        if not title or not description or not latitude or not longitude:
            return Response({'error': 'Title, description, latitude, and longitude are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Compute multi-factor priority
        priority, priority_score, priority_factors = PriorityAssessmentEngine.calculate_priority(
            category=category,
            user_severity=user_severity,
            is_sensitive_location=is_sensitive,
            age_hours=0,
            is_reopened=False
        )

        # 2. Check for potential duplicate complaints
        candidates = DuplicateDetectionEngine.find_potential_duplicates(
            latitude=latitude,
            longitude=longitude,
            category_id=category.id,
            title=title,
            description=description
        )

        is_duplicate = len(candidates) > 0
        top_duplicate_score = candidates[0]['combined_score'] if is_duplicate else None
        top_duplicate_id = candidates[0]['id'] if is_duplicate else None

        # 3. Create complaint
        complaint = Complaint.objects.create(
            citizen=user,
            title=title,
            description=description,
            category=category,
            department=category.default_department,
            status='REPORTED',
            priority=priority,
            priority_score=priority_score,
            priority_factors=priority_factors,
            latitude=latitude,
            longitude=longitude,
            address=address,
            landmark=landmark,
            ward_zone=ward_zone,
            is_duplicate_flag=is_duplicate,
            duplicate_similarity_score=top_duplicate_score,
            duplicate_of_id=top_duplicate_id
        )

        # Log duplicate candidates if found
        for cand in candidates:
            try:
                matched_obj = Complaint.objects.get(id=cand['id'])
                DuplicateDetectionLog.objects.create(
                    new_complaint=complaint,
                    matched_complaint=matched_obj,
                    geo_distance_meters=cand['distance_meters'],
                    text_similarity_score=cand['text_similarity'],
                    category_match=cand['category_match'],
                    combined_score=cand['combined_score'],
                    review_status='PENDING'
                )
            except Exception:
                pass

        # 4. Save initial status history entry
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            from_status=None,
            to_status='REPORTED',
            changed_by=user,
            remarks='Complaint submitted by citizen via mobile/web portal.'
        )

        # 5. Handle media files (photos/videos)
        files = request.FILES.getlist('media') or [request.FILES.get('media')]
        for media_file in files:
            if media_file:
                media_type = 'VIDEO' if any(media_file.name.lower().endswith(ext) for ext in ['.mp4', '.mov', '.avi', '.webm']) else 'IMAGE'
                ComplaintMedia.objects.create(
                    complaint=complaint,
                    file=media_file,
                    media_type=media_type,
                    is_resolution_evidence=False,
                    uploaded_by=user,
                    caption='Citizen initial issue evidence'
                )

        # 6. Log AI prediction record if AI classification was involved
        ai_cat_id = data.get('ai_category_id')
        if ai_cat_id:
            try:
                ai_cat = Category.objects.get(id=ai_cat_id)
                confidence = float(data.get('ai_confidence', 0.8))
                AIPrediction.objects.create(
                    complaint=complaint,
                    predicted_category=ai_cat,
                    confidence_score=confidence,
                    suggested_department=ai_cat.default_department,
                    user_overridden=(ai_cat.id != category.id),
                    actual_category=category
                )
            except Exception:
                pass

        # 7. Create notification for citizen
        create_notification(
            recipient=user,
            complaint=complaint,
            title=f"Complaint Registered: {complaint.complaint_id}",
            message=f"Your complaint '{complaint.title}' has been registered. Tracking ID: {complaint.complaint_id}",
            notification_type='STATUS_UPDATE'
        )

        # 8. Audit record
        AuditRecord.objects.create(
            user=user,
            action='COMPLAINT_SUBMITTED',
            entity_type='Complaint',
            entity_id=complaint.complaint_id,
            details={'priority': priority, 'category': category.name, 'is_duplicate': is_duplicate}
        )

        serializer = ComplaintDetailSerializer(complaint, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def track_by_id(self, request):
        """Public endpoint to track complaint by ID (e.g. CIV-2026-XXXX)."""
        complaint_id = request.query_params.get('complaint_id', '').strip()
        if not complaint_id:
            return Response({'error': 'Please provide a valid Complaint ID.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            complaint = Complaint.objects.select_related('category', 'department', 'citizen', 'assigned_official') \
                                         .prefetch_related('media', 'status_history', 'assignments') \
                                         .get(complaint_id__iexact=complaint_id)
            serializer = ComplaintDetailSerializer(complaint, context={'request': request})
            return Response(serializer.data)
        except Complaint.DoesNotExist:
            return Response({'error': f"No complaint found matching ID '{complaint_id}'."}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Administrative or Official status lifecycle update."""
        complaint = self.get_object()
        new_status = request.data.get('status')
        remarks = request.data.get('remarks', '')

        valid_statuses = dict(Complaint.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response({'error': f"Invalid status: {new_status}"}, status=status.HTTP_400_BAD_REQUEST)

        old_status = complaint.status
        complaint.status = new_status

        if new_status == 'VERIFIED' and not complaint.verified_at:
            complaint.verified_at = timezone.now()
        elif new_status == 'RESOLVED' and not complaint.resolved_at:
            complaint.resolved_at = timezone.now()
        elif new_status == 'CLOSED' and not complaint.closed_at:
            complaint.closed_at = timezone.now()

        # Update priority override if provided
        new_priority = request.data.get('priority')
        if new_priority in dict(Complaint.PRIORITY_CHOICES):
            complaint.priority = new_priority

        complaint.save()

        # Record history
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            remarks=remarks
        )

        # Notify
        notify_status_change(complaint, old_status, new_status, remarks)

        # Audit
        AuditRecord.objects.create(
            user=request.user,
            action=f"STATUS_UPDATED_{new_status}",
            entity_type='Complaint',
            entity_id=complaint.complaint_id,
            details={'from_status': old_status, 'to_status': new_status, 'remarks': remarks}
        )

        return Response(ComplaintDetailSerializer(complaint, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign complaint to department and/or official."""
        complaint = self.get_object()
        department_id = request.data.get('department_id')
        official_id = request.data.get('official_id')
        notes = request.data.get('notes', '')

        if not department_id:
            return Response({'error': 'Department is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            dept = Department.objects.get(id=department_id)
        except Department.DoesNotExist:
            return Response({'error': 'Department not found'}, status=status.HTTP_404_NOT_FOUND)

        official = None
        if official_id:
            try:
                official = CustomUser.objects.get(id=official_id, role='OFFICIAL')
            except CustomUser.DoesNotExist:
                return Response({'error': 'Official user not found'}, status=status.HTTP_404_NOT_FOUND)

        old_status = complaint.status
        complaint.department = dept
        complaint.assigned_official = official
        if complaint.status in ['REPORTED', 'VERIFIED']:
            complaint.status = 'ASSIGNED'
        complaint.save()

        ComplaintAssignment.objects.create(
            complaint=complaint,
            department=dept,
            assigned_to=official,
            assigned_by=request.user,
            notes=notes
        )

        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            from_status=old_status,
            to_status=complaint.status,
            changed_by=request.user,
            remarks=f"Assigned to {dept.name}" + (f" (Official: {official.get_full_name()})" if official else "") + (f": {notes}" if notes else "")
        )

        # Notification to citizen and assigned official
        create_notification(
            recipient=complaint.citizen,
            complaint=complaint,
            title=f"Complaint Assigned: {complaint.complaint_id}",
            message=f"Your complaint has been assigned to {dept.name} for resolution.",
            notification_type='ASSIGNMENT'
        )

        if official:
            create_notification(
                recipient=official,
                complaint=complaint,
                title=f"New Task Assigned: {complaint.complaint_id}",
                message=f"You have been assigned to resolve complaint '{complaint.title}' in {dept.name}.",
                notification_type='ASSIGNMENT'
            )

        AuditRecord.objects.create(
            user=request.user,
            action='COMPLAINT_ASSIGNED',
            entity_type='Complaint',
            entity_id=complaint.complaint_id,
            details={'department': dept.name, 'official': official.username if official else None}
        )

        return Response(ComplaintDetailSerializer(complaint, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Department official marks issue as resolved with proof and remarks."""
        complaint = self.get_object()
        action_taken = request.data.get('action_taken', '').strip()
        material_used = request.data.get('material_used', '').strip()
        resolution_file = request.FILES.get('resolution_evidence')

        if not action_taken:
            return Response({'error': 'Official action taken remarks are required.'}, status=status.HTTP_400_BAD_REQUEST)

        old_status = complaint.status
        complaint.status = 'RESOLVED'
        complaint.resolved_at = timezone.now()
        complaint.save()

        # Save resolution record
        res_record = ResolutionRecord.objects.create(
            complaint=complaint,
            resolved_by=request.user,
            action_taken=action_taken,
            material_used=material_used,
            resolution_photo=resolution_file
        )

        # Also add to ComplaintMedia
        if resolution_file:
            ComplaintMedia.objects.create(
                complaint=complaint,
                file=resolution_file,
                media_type='IMAGE',
                is_resolution_evidence=True,
                uploaded_by=request.user,
                caption=f"Resolution proof: {action_taken[:60]}"
            )

        # History
        ComplaintStatusHistory.objects.create(
            complaint=complaint,
            from_status=old_status,
            to_status='RESOLVED',
            changed_by=request.user,
            remarks=f"Resolution reported: {action_taken}. Pending citizen confirmation."
        )

        # Notify citizen to verify resolution
        create_notification(
            recipient=complaint.citizen,
            complaint=complaint,
            title=f"Action Required: Verify Resolution for {complaint.complaint_id}",
            message=f"Department authorities reported that '{complaint.title}' has been resolved. Please review the evidence and verify.",
            notification_type='RESOLUTION'
        )

        AuditRecord.objects.create(
            user=request.user,
            action='COMPLAINT_RESOLVED',
            entity_type='Complaint',
            entity_id=complaint.complaint_id,
            details={'action_taken': action_taken, 'resolved_by': request.user.username}
        )

        return Response(ComplaintDetailSerializer(complaint, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Citizen resolution verification.
        - CONFIRM: Accepts resolution, provides rating & feedback, transitions status to CLOSED.
        - REOPEN: Flags issue as unsatisfied, provides reason, transitions status back to REOPENED with priority escalation.
        """
        complaint = self.get_object()
        user = request.user

        # Only the reporting citizen or admin can verify resolution
        if user != complaint.citizen and user.role != 'ADMIN':
            return Response({'error': 'Only the reporting citizen or an administrator can verify this complaint.'}, status=status.HTTP_403_FORBIDDEN)

        verification_action = request.data.get('action')  # 'CONFIRM' or 'REOPEN'

        if verification_action == 'CONFIRM':
            rating = request.data.get('rating', 5)
            comment = request.data.get('comment', '')
            try:
                rating = int(rating)
                if rating < 1 or rating > 5:
                    rating = 5
            except (TypeError, ValueError):
                rating = 5

            old_status = complaint.status
            complaint.status = 'CLOSED'
            complaint.closed_at = timezone.now()
            complaint.save()

            CitizenFeedback.objects.update_or_create(
                complaint=complaint,
                defaults={
                    'citizen': user,
                    'rating': rating,
                    'comment': comment,
                    'is_satisfied': True
                }
            )

            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                from_status=old_status,
                to_status='CLOSED',
                changed_by=user,
                remarks=f"Citizen verified resolution. Rated {rating}/5 stars. Feedback: {comment}"
            )

            create_notification(
                recipient=user,
                complaint=complaint,
                title=f"Complaint Closed: {complaint.complaint_id}",
                message="Thank you for confirming resolution and helping improve our city!",
                notification_type='CLOSED'
            )

            if complaint.assigned_official:
                create_notification(
                    recipient=complaint.assigned_official,
                    complaint=complaint,
                    title=f"Resolution Confirmed: {complaint.complaint_id}",
                    message=f"Citizen confirmed resolution with a {rating}/5 star rating.",
                    notification_type='FEEDBACK_RECEIVED'
                )

        elif verification_action == 'REOPEN':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'error': 'Please provide the reason why the issue is not resolved.'}, status=status.HTTP_400_BAD_REQUEST)

            old_status = complaint.status
            complaint.status = 'REOPENED'
            # Escalate priority
            new_priority, new_score, new_factors = PriorityAssessmentEngine.calculate_priority(
                category=complaint.category,
                user_severity='HIGH',
                is_sensitive_location=True,
                age_hours=72,
                is_reopened=True
            )
            complaint.priority = new_priority
            complaint.priority_score = new_score
            complaint.priority_factors = new_factors
            complaint.save()

            ComplaintStatusHistory.objects.create(
                complaint=complaint,
                from_status=old_status,
                to_status='REOPENED',
                changed_by=user,
                remarks=f"Citizen reported issue as NOT resolved: {reason}. Priority escalated to {new_priority}."
            )

            # Notify officials and admins
            if complaint.assigned_official:
                create_notification(
                    recipient=complaint.assigned_official,
                    complaint=complaint,
                    title=f"URGENT: Complaint Reopened: {complaint.complaint_id}",
                    message=f"Citizen reopened complaint. Reason: {reason}",
                    notification_type='REOPENED'
                )

        else:
            return Response({'error': "Action must be 'CONFIRM' or 'REOPEN'"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(ComplaintDetailSerializer(complaint, context={'request': request}).data)
