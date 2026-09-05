"""
URL configuration for civic_api project.
Civic Issue Reporting and Tracking System (CivicPulse)
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.authentication.urls')),
    path('api/', include('apps.complaints.urls')),
    path('api/', include('apps.ai_engine.urls')),
    path('api/', include('apps.analytics.urls')),
    path('api/', include('apps.notifications.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
