from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ComplaintViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('', include(router.urls)),
]
