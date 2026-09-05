from django.db import models
from apps.authentication.models import Department
from apps.complaints.models import Category, Complaint

class AIPrediction(models.Model):
    """Log of AI-assisted category classification and department suggestion."""
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, null=True, blank=True, related_name='ai_predictions')
    predicted_category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='predicted_by_ai')
    confidence_score = models.FloatField(default=0.0, help_text='Prediction confidence from 0.0 to 1.0')
    suggested_department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    feature_summary = models.JSONField(default=dict, blank=True)
    user_overridden = models.BooleanField(default=False, help_text='True if user or authority selected a different category')
    actual_category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='corrected_by_user')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        cat_name = self.predicted_category.name if self.predicted_category else "Unknown"
        return f"AI Suggestion: {cat_name} ({self.confidence_score*100:.1f}%)"


class DuplicateDetectionLog(models.Model):
    """Detailed trace of candidate duplicate matches computed by the multi-factor detection engine."""
    REVIEW_STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('CONFIRMED_DUPLICATE', 'Confirmed Duplicate'),
        ('FALSE_POSITIVE', 'Distinct Issue'),
    )
    new_complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='duplicate_checks_as_new')
    matched_complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE, related_name='duplicate_checks_as_existing')
    geo_distance_meters = models.FloatField(help_text='Haversine distance in meters')
    text_similarity_score = models.FloatField(help_text='Text TF-IDF/Jaccard cosine similarity score (0.0 to 1.0)')
    category_match = models.BooleanField(default=False)
    image_similarity_score = models.FloatField(default=0.0, help_text='Visual perceptual/histogram similarity (0.0 to 1.0)')
    combined_score = models.FloatField(help_text='Weighted composite similarity score (0.0 to 1.0)')
    review_status = models.CharField(max_length=25, choices=REVIEW_STATUS_CHOICES, default='PENDING')
    flagged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-combined_score', '-flagged_at']

    def __str__(self):
        return f"Match: {self.new_complaint.complaint_id} <-> {self.matched_complaint.complaint_id} (Score: {self.combined_score:.2f})"
