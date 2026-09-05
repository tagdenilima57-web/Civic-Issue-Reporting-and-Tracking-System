import uuid
from django.db import models
from django.conf import settings
from apps.authentication.models import Department

def complaint_media_upload_path(instance, filename):
    return f"complaints/{instance.complaint.complaint_id}/{filename}"

def resolution_media_upload_path(instance, filename):
    return f"resolutions/{instance.complaint.complaint_id}/{filename}"


class Category(models.Model):
    """Civic issue categories mapped to default departments and SLAs."""
    SEVERITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default='AlertCircle')
    default_department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='categories')
    base_severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='MEDIUM')
    sla_hours = models.PositiveIntegerField(default=48, help_text='Expected resolution turnaround time in hours')
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} -> {self.default_department.name}"


class Complaint(models.Model):
    """Core civic issue complaint entity following the complete municipal lifecycle."""
    STATUS_CHOICES = (
        ('REPORTED', 'Reported'),
        ('VERIFIED', 'Verified'),
        ('ASSIGNED', 'Assigned'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
        ('REOPENED', 'Reopened'),
    )

    PRIORITY_CHOICES = (
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    )

    complaint_id = models.CharField(max_length=32, unique=True, db_index=True)
    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='complaints')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='complaints')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')

    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='REPORTED', db_index=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM', db_index=True)
    priority_score = models.IntegerField(default=50, help_text='Computed priority score from 0 to 100')
    priority_factors = models.JSONField(default=dict, blank=True)

    # Geospatial location
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)
    address = models.CharField(max_length=255, blank=True)
    landmark = models.CharField(max_length=150, blank=True)
    ward_zone = models.CharField(max_length=50, blank=True)

    # Duplicate detection linkage
    is_duplicate_flag = models.BooleanField(default=False, db_index=True)
    duplicate_of = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicate_instances')
    duplicate_similarity_score = models.FloatField(null=True, blank=True)

    assigned_official = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_complaints'
    )

    # Verification and timestamps
    verified_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.complaint_id}: {self.title} [{self.get_status_display()}]"

    def save(self, *args, **kwargs):
        if not self.complaint_id:
            # Generate human-readable identifier: CIV-2026-XXXX
            unique_hex = uuid.uuid4().hex[:6].upper()
            self.complaint_id = f"CIV-2026-{unique_hex}"
        if not self.department and self.category:
            self.department = self.category.default_department
        super().save(*args, **kwargs)


class ComplaintMedia(models.Model):
    """Media evidence attached to complaint (initial citizen upload or official resolution proof)."""
    MEDIA_TYPES = (
        ('IMAGE', 'Image'),
        ('VIDEO', 'Video'),
    )
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='media')
    file = models.FileField(upload_to=complaint_media_upload_path)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES, default='IMAGE')
    is_resolution_evidence = models.BooleanField(default=False, help_text='True if uploaded by authority as proof of resolution')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']

    def __str__(self):
        evidence_tag = "Resolution Evidence" if self.is_resolution_evidence else "Report Evidence"
        return f"{self.complaint.complaint_id} - {evidence_tag} ({self.media_type})"


class ComplaintStatusHistory(models.Model):
    """Audit log of lifecycle status changes."""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='status_history')
    from_status = models.CharField(max_length=30, blank=True, null=True)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    remarks = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['changed_at']

    def __str__(self):
        return f"{self.complaint.complaint_id}: {self.from_status} -> {self.to_status}"


class ComplaintAssignment(models.Model):
    """Official department and worker assignment log."""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='task_assignments'
    )
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='made_assignments'
    )
    notes = models.TextField(blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-assigned_at']


class CitizenFeedback(models.Model):
    """Citizen post-resolution verification, satisfaction rating, and comments."""
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='feedback')
    citizen = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='submitted_feedbacks')
    rating = models.PositiveSmallIntegerField(help_text='Rating from 1 (Very Dissatisfied) to 5 (Very Satisfied)')
    comment = models.TextField(blank=True)
    is_satisfied = models.BooleanField(default=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.complaint.complaint_id} Feedback: {self.rating}/5"


class ResolutionRecord(models.Model):
    """Detailed record of the municipal official resolution action."""
    complaint = models.OneToOneField(Complaint, on_delete=models.CASCADE, related_name='resolution_record')
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action_taken = models.TextField(help_text='Official description of work done to resolve the issue')
    material_used = models.CharField(max_length=255, blank=True)
    resolution_photo = models.FileField(upload_to='resolutions/', null=True, blank=True)
    resolved_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Resolution for {self.complaint.complaint_id}"
