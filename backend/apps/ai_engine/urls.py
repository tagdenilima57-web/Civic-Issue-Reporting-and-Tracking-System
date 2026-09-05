from django.urls import path
from .views import ClassifyImageView, CheckDuplicateView, AssessPriorityView

urlpatterns = [
    path('ai/classify-image/', ClassifyImageView.as_view(), name='ai_classify_image'),
    path('ai/check-duplicate/', CheckDuplicateView.as_view(), name='ai_check_duplicate'),
    path('ai/assess-priority/', AssessPriorityView.as_view(), name='ai_assess_priority'),
]
