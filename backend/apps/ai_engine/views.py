from rest_framework import views, status, permissions
from rest_framework.response import Response
from apps.complaints.models import Category
from .services import (
    AIIssueClassificationService,
    DuplicateDetectionEngine,
    PriorityAssessmentEngine
)

class ClassifyImageView(views.APIView):
    """
    Endpoint for uploading an image to obtain an AI-assisted category
    and department suggestion with full transparency and confidence score.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

        result = AIIssueClassificationService.classify_image(image_file)
        return Response(result, status=status.HTTP_200_OK)


class CheckDuplicateView(views.APIView):
    """
    Endpoint to pre-check if a complaint is a potential duplicate
    prior to or during submission based on GIS proximity and text similarity.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        category_id = request.data.get('category_id')
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        exclude_id = request.data.get('exclude_complaint_id')

        if not latitude or not longitude:
            return Response({
                'has_potential_duplicates': False,
                'duplicates': []
            }, status=status.HTTP_200_OK)

        candidates = DuplicateDetectionEngine.find_potential_duplicates(
            latitude=latitude,
            longitude=longitude,
            category_id=category_id,
            title=title,
            description=description,
            exclude_complaint_id=exclude_id
        )

        has_potential = len(candidates) > 0

        return Response({
            'has_potential_duplicates': has_potential,
            'count': len(candidates),
            'top_similarity': candidates[0]['combined_score'] if has_potential else 0.0,
            'duplicates': candidates,
            'message': (
                f"Found {len(candidates)} active nearby complaint(s) that may describe the same problem."
                if has_potential else "No duplicate complaints detected nearby."
            )
        }, status=status.HTTP_200_OK)


class AssessPriorityView(views.APIView):
    """
    Endpoint to calculate estimated priority based on transparent multi-factor metrics.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        category_id = request.data.get('category_id')
        user_severity = request.data.get('severity', 'MODERATE')
        is_sensitive = bool(request.data.get('is_sensitive_location', False))

        category = None
        if category_id:
            try:
                category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                pass

        if not category:
            category = Category.objects.first()

        priority, total_score, factors = PriorityAssessmentEngine.calculate_priority(
            category=category,
            user_severity=user_severity,
            is_sensitive_location=is_sensitive,
            age_hours=0,
            is_reopened=False
        )

        return Response({
            'priority': priority,
            'priority_score': total_score,
            'factors': factors,
            'explanation': f"Evaluated as {priority} priority (Score: {total_score}/100) based on base issue type, reported hazard severity, and zone sensitivity."
        }, status=status.HTTP_200_OK)
