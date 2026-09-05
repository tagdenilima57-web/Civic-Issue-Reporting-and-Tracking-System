from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    complaint_identifier = serializers.CharField(source='complaint.complaint_id', read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'complaint', 'complaint_identifier', 'title', 'message', 'notification_type', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
