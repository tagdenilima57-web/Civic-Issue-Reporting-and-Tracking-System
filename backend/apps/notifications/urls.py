from django.urls import path
from .views import NotificationListView, MarkNotificationReadView, MarkAllNotificationsReadView

urlpatterns = [
    path('notifications/', NotificationListView.as_view(), name='notification_list'),
    path('notifications/<int:pk>/read/', MarkNotificationReadView.as_view(), name='mark_notification_read'),
    path('notifications/mark-all-read/', MarkAllNotificationsReadView.as_view(), name='mark_all_notifications_read'),
]
