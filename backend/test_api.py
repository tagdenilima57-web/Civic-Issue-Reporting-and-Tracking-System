import os
import django
import io
import json
from PIL import Image

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic_api.settings')
django.setup()

from rest_framework.test import APIClient
from apps.authentication.models import CustomUser
from apps.complaints.models import Complaint, Category

def test_backend():
    print("Beginning comprehensive backend API testing...")
    client = APIClient()

    # 1. Test Login
    login_resp = client.post('/api/auth/login/', {'username_or_email': 'citizen@example.com', 'password': 'citizen123'}, format='json')
    assert login_resp.status_code == 200, f"Citizen login failed: {login_resp.data}"
    citizen_token = login_resp.data['token']
    print("PASS: Citizen login & JWT token generation.")

    admin_resp = client.post('/api/auth/login/', {'username_or_email': 'admin@civicpulse.gov', 'password': 'admin123'}, format='json')
    assert admin_resp.status_code == 200, f"Admin login failed: {admin_resp.data}"
    admin_token = admin_resp.data['token']
    print("PASS: Admin login & JWT token generation.")

    # 2. Test Dashboard Stats
    stats_resp = client.get('/api/analytics/dashboard/')
    assert stats_resp.status_code == 200, f"Stats failed: {stats_resp.data}"
    assert stats_resp.data['total_complaints'] >= 8
    print(f"PASS: Dashboard stats. Total complaints: {stats_resp.data['total_complaints']}, Satisfaction rate: {stats_resp.data['satisfaction_rate']}%")

    # 3. Test GIS Map data
    gis_resp = client.get('/api/analytics/gis-map/')
    assert gis_resp.status_code == 200
    assert len(gis_resp.data['markers']) >= 8
    assert len(gis_resp.data['heatmap_points']) >= 8
    print(f"PASS: GIS map endpoint returned {len(gis_resp.data['markers'])} geo markers and heatmap points.")

    # 4. Test AI Priority Assessment
    cat = Category.objects.get(slug='damaged-roads')
    prio_resp = client.post('/api/ai/assess-priority/', {
        'category_id': cat.id,
        'severity': 'CRITICAL',
        'is_sensitive_location': True
    }, format='json')
    assert prio_resp.status_code == 200
    assert prio_resp.data['priority'] == 'CRITICAL'
    print(f"PASS: AI Priority Assessment: {prio_resp.data['priority']} (Score: {prio_resp.data['priority_score']})")

    # 5. Test Duplicate Detection Engine
    dup_resp = client.post('/api/ai/check-duplicate/', {
        'latitude': 12.9753,
        'longitude': 77.5986,
        'category_id': cat.id,
        'title': 'Big pothole on the road near central metro',
        'description': 'Very deep crater near metro station'
    }, format='json')
    assert dup_resp.status_code == 200
    assert dup_resp.data['has_potential_duplicates'] is True
    print(f"PASS: Duplicate detection flagged {dup_resp.data['count']} nearby match(es) with top score {dup_resp.data['top_similarity']}.")

    # 6. Test AI Image Classification
    # Generate in-memory dark asphalt pothole pattern
    img = Image.new('RGB', (200, 200), color=(45, 45, 48))
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='JPEG')
    img_byte_arr.seek(0)
    img_byte_arr.name = 'test_pothole.jpg'

    ai_resp = client.post('/api/ai/classify-image/', {'image': img_byte_arr}, format='multipart')
    assert ai_resp.status_code == 200
    assert ai_resp.data['is_ai_suggestion'] is True
    print(f"PASS: AI Classification returned: {ai_resp.data['category_name']} (Confidence: {ai_resp.data['confidence_percent']}%), Suggested Dept: {ai_resp.data['suggested_department_name']}")

    # 7. Test Public Tracking Endpoint
    track_resp = client.get('/api/complaints/track_by_id/?complaint_id=CIV-2026-A101')
    assert track_resp.status_code == 200
    assert track_resp.data['complaint_id'] == 'CIV-2026-A101'
    print(f"PASS: Public tracking for CIV-2026-A101 verified. Status: {track_resp.data['status']}.")

    print("\nALL 7 BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    test_backend()
