from django.db import models
from django.conf import settings
from apps.complaints.models import Complaint

class Notification(models.Model):
    """In-app notifications for citizens and municipal personnel."""
    TYPE_CHOICES = (
        ('STATUS_CHANGE', 'Status Change'),
        ('VERIFIED', 'Issue Verified'),
        ('ASSIGNED', 'Official Assigned'),
        ('IN_PROGRESS', 'Work In Progress'),
        ('RESOLVED', 'Issue Resolved'),
        ('CLOSED', 'Complaint Closed'),
        ('REOPENED', 'Complaint Reopened'),
        ('FEEDBACK_RECEIVED', 'Citizen Feedback Submitted'),
        ('DUPLICATE_FLAGGED', 'Possible Duplicate Flagged'),
    )

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=40, choices=TYPE_CHOICES, default='STATUS_CHANGE')
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification to {self.recipient.username}: {self.title}"
