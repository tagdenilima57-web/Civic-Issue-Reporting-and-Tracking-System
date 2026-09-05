from .models import Notification
from apps.authentication.models import CustomUser

def create_notification(recipient, complaint, title, message, notification_type='STATUS_UPDATE'):
    """Helper to dispatch in-app notifications to users."""
    if not recipient:
        return None
    return Notification.objects.create(
        recipient=recipient,
        complaint=complaint,
        title=title,
        message=message,
        notification_type=notification_type
    )

def notify_status_change(complaint, from_status, to_status, remarks=None):
    """Notify citizen and relevant officials when complaint lifecycle status changes."""
    status_messages = {
        'VERIFIED': f"Your complaint {complaint.complaint_id} has been verified by municipal authorities.",
        'ASSIGNED': f"Complaint {complaint.complaint_id} has been assigned to {complaint.department.name if complaint.department else 'the relevant department'}.",
        'IN_PROGRESS': f"Work is now in progress for complaint {complaint.complaint_id}.",
        'RESOLVED': f"Official resolution reported for complaint {complaint.complaint_id}. Please review resolution evidence and verify.",
        'CLOSED': f"Complaint {complaint.complaint_id} has been successfully closed. Thank you for your feedback!",
        'REOPENED': f"Complaint {complaint.complaint_id} was reopened by the citizen for further inspection.",
    }

    message = status_messages.get(to_status, f"Complaint {complaint.complaint_id} status updated to {to_status}.")
    if remarks:
        message += f" Remarks: {remarks}"

    # Notify citizen
    create_notification(
        recipient=complaint.citizen,
        complaint=complaint,
        title=f"Update on {complaint.complaint_id}: {to_status}",
        message=message,
        notification_type=to_status if to_status in dict(Notification.TYPE_CHOICES) else 'STATUS_CHANGE'
    )

    # If assigned to an official, notify them as well
    if complaint.assigned_official and complaint.assigned_official != complaint.citizen:
        create_notification(
            recipient=complaint.assigned_official,
            complaint=complaint,
            title=f"Task Update: {complaint.complaint_id}",
            message=f"Status changed to {to_status}. {remarks or ''}",
            notification_type='STATUS_UPDATE'
        )
