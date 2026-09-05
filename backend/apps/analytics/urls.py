from django.urls import path
from .views import DashboardStatsView, GISMapDataView

urlpatterns = [
    path('analytics/dashboard/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('analytics/gis-map/', GISMapDataView.as_view(), name='gis_map_data'),
]
