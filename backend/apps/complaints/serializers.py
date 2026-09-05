from rest_framework import serializers
from .models import (
    Category, Complaint, ComplaintMedia, ComplaintStatusHistory,
    ComplaintAssignment, CitizenFeedback, ResolutionRecord
)
from apps.authentication.serializers import UserSerializer, DepartmentSerializer

class CategorySerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='default_department.name', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'default_department', 'department_name', 'base_severity', 'sla_hours', 'is_active']


class ComplaintMediaSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ComplaintMedia
        fields = ['id', 'file', 'file_url', 'media_type', 'is_resolution_evidence', 'caption', 'uploaded_by', 'uploaded_by_name', 'uploaded_at']

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class ComplaintStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.get_full_name', read_only=True)
    changed_by_role = serializers.CharField(source='changed_by.role', read_only=True)

    class Meta:
        model = ComplaintStatusHistory
        fields = ['id', 'from_status', 'to_status', 'changed_by', 'changed_by_name', 'changed_by_role', 'remarks', 'changed_at']


class ComplaintAssignmentSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    assigned_by_name = serializers.CharField(source='assigned_by.get_full_name', read_only=True)

    class Meta:
        model = ComplaintAssignment
        fields = ['id', 'department', 'department_name', 'assigned_to', 'assigned_to_name', 'assigned_by', 'assigned_by_name', 'notes', 'assigned_at']


class CitizenFeedbackSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)

    class Meta:
        model = CitizenFeedback
        fields = ['id', 'rating', 'comment', 'is_satisfied', 'citizen_name', 'submitted_at']


class ResolutionRecordSerializer(serializers.ModelSerializer):
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True)
    resolution_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = ResolutionRecord
        fields = ['id', 'action_taken', 'material_used', 'resolution_photo', 'resolution_photo_url', 'resolved_by_name', 'resolved_at']

    def get_resolution_photo_url(self, obj):
        if obj.resolution_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.resolution_photo.url)
            return obj.resolution_photo.url
        return None


class ComplaintListSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    citizen_name = serializers.CharField(source='citizen.get_full_name', read_only=True)
    primary_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_id', 'title', 'status', 'priority', 'priority_score',
            'category', 'category_details', 'department', 'department_details',
            'citizen', 'citizen_name', 'latitude', 'longitude', 'address', 'landmark',
            'is_duplicate_flag', 'duplicate_of', 'created_at', 'updated_at',
            'primary_image_url'
        ]

    def get_primary_image_url(self, obj):
        first_media = obj.media.filter(is_resolution_evidence=False).first()
        if first_media and first_media.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_media.file.url)
            return first_media.file.url
        return None


class ComplaintDetailSerializer(serializers.ModelSerializer):
    category_details = CategorySerializer(source='category', read_only=True)
    department_details = DepartmentSerializer(source='department', read_only=True)
    citizen_details = UserSerializer(source='citizen', read_only=True)
    assigned_official_details = UserSerializer(source='assigned_official', read_only=True)
    media = ComplaintMediaSerializer(many=True, read_only=True)
    status_history = ComplaintStatusHistorySerializer(many=True, read_only=True)
    assignments = ComplaintAssignmentSerializer(many=True, read_only=True)
    feedback = CitizenFeedbackSerializer(read_only=True)
    resolution_record = ResolutionRecordSerializer(read_only=True)
    potential_duplicates_count = serializers.SerializerMethodField()

    class Meta:
        model = Complaint
        fields = [
            'id', 'complaint_id', 'title', 'description', 'status', 'priority', 'priority_score', 'priority_factors',
            'category', 'category_details', 'department', 'department_details',
            'citizen', 'citizen_details', 'assigned_official', 'assigned_official_details',
            'latitude', 'longitude', 'address', 'landmark', 'ward_zone',
            'is_duplicate_flag', 'duplicate_of', 'duplicate_similarity_score',
            'potential_duplicates_count',
            'media', 'status_history', 'assignments', 'feedback', 'resolution_record',
            'verified_at', 'resolved_at', 'closed_at', 'created_at', 'updated_at'
        ]

    def get_potential_duplicates_count(self, obj):
        return obj.duplicate_checks_as_new.count()
