from django.db import models
from django.contrib.auth.models import AbstractUser

class Department(models.Model):
    """Municipal department responsible for civic issue resolution."""
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class CustomUser(AbstractUser):
    """Extended user model supporting Citizens, Admins, and Department Officials."""
    ROLE_CHOICES = (
        ('CITIZEN', 'Citizen'),
        ('ADMIN', 'Administrator'),
        ('OFFICIAL', 'Department Official'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN', db_index=True)
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='officials',
        help_text='Assigned department if role is Department Official'
    )
    phone_number = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=255, blank=True)
    ward_number = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_admin_user(self):
        return self.role == 'ADMIN' or self.is_superuser

    def is_official_user(self):
        return self.role == 'OFFICIAL'

    def is_citizen_user(self):
        return self.role == 'CITIZEN'

    def __str__(self):
        return f"{self.username} [{self.get_role_display()}]"
