import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civic_api.settings')
django.setup()

from apps.authentication.models import CustomUser, Department
from apps.complaints.models import (
    Category, Complaint, ComplaintMedia, ComplaintStatusHistory,
    ComplaintAssignment, CitizenFeedback, ResolutionRecord
)
from apps.ai_engine.models import AIPrediction, DuplicateDetectionLog
from apps.notifications.models import Notification
from apps.analytics.models import AuditRecord

def seed_database():
    print("Seeding CivicPulse database...")

    # 1. Departments
    dept_data = [
        {'name': 'Public Works Department (Roads & Bridges)', 'code': 'PWD', 'description': 'Responsible for municipal road maintenance, potholes, paving, and bridge structures.', 'contact_email': 'pwd@civicpulse.gov', 'contact_phone': '+1 (555) 019-2831'},
        {'name': 'Solid Waste Management & Sanitation', 'code': 'SWM', 'description': 'Handles garbage collection, debris removal, street sweeping, and illegal dumping remediation.', 'contact_email': 'sanitation@civicpulse.gov', 'contact_phone': '+1 (555) 019-2832'},
        {'name': 'Water Supply & Sewerage Board', 'code': 'BWSSB', 'description': 'Maintains municipal drinking water pipelines, sewage lines, and stormwater drains.', 'contact_email': 'water@civicpulse.gov', 'contact_phone': '+1 (555) 019-2833'},
        {'name': 'Electrical & Street Lighting Authority', 'code': 'BESCOM', 'description': 'Oversees street lighting networks, pole repairs, dark-spot elimination, and municipal wiring.', 'contact_email': 'lighting@civicpulse.gov', 'contact_phone': '+1 (555) 019-2834'},
        {'name': 'Traffic Management & Signal Authority', 'code': 'TRAFFIC', 'description': 'Maintains traffic light controllers, road signs, pedestrian crossings, and junction signaling.', 'contact_email': 'traffic@civicpulse.gov', 'contact_phone': '+1 (555) 019-2835'},
        {'name': 'Parks & Urban Horticulture Department', 'code': 'HORT', 'description': 'Manages municipal green canopy, fallen tree clearing, park maintenance, and hazardous bough removal.', 'contact_email': 'parks@civicpulse.gov', 'contact_phone': '+1 (555) 019-2836'},
        {'name': 'Public Health & Civic Amenities', 'code': 'HEALTH', 'description': 'Oversees public sanitation amenities, public restrooms, and hygiene inspections.', 'contact_email': 'health@civicpulse.gov', 'contact_phone': '+1 (555) 019-2837'},
    ]

    departments = {}
    for d in dept_data:
        dept, _ = Department.objects.get_or_create(code=d['code'], defaults=d)
        departments[d['code']] = dept
    print(f"Created {len(departments)} departments.")

    # 2. Categories
    category_data = [
        {'name': 'Potholes & Damaged Roads', 'slug': 'damaged-roads', 'description': 'Road fissures, craters, broken asphalt, and pavement subsidence.', 'icon': 'AlertTriangle', 'default_department': departments['PWD'], 'base_severity': 'HIGH', 'sla_hours': 48},
        {'name': 'Garbage Accumulation & Litter', 'slug': 'garbage-accumulation', 'description': 'Uncollected roadside waste, overflowing dumpsters, and illegal solid dumping.', 'icon': 'Trash2', 'default_department': departments['SWM'], 'base_severity': 'MEDIUM', 'sla_hours': 24},
        {'name': 'Broken Streetlights & Dark Spots', 'slug': 'streetlights', 'description': 'Non-functional street lamps, damaged poles, and hazardous dark pedestrian corridors.', 'icon': 'LightbulbOff', 'default_department': departments['BESCOM'], 'base_severity': 'MEDIUM', 'sla_hours': 36},
        {'name': 'Water Pipe Leakage & Sewage Burst', 'slug': 'water-leakage', 'description': 'Main pipeline rupture, potable water wastage, and sewer overflow hazards.', 'icon': 'Droplets', 'default_department': departments['BWSSB'], 'base_severity': 'HIGH', 'sla_hours': 24},
        {'name': 'Damaged Traffic Signals', 'slug': 'traffic-signals', 'description': 'Dead traffic lights, knocked-over poles, and erratic signal timers at intersections.', 'icon': 'Compass', 'default_department': departments['TRAFFIC'], 'base_severity': 'CRITICAL', 'sla_hours': 12},
        {'name': 'Fallen Trees & Hazardous Branches', 'slug': 'fallen-trees', 'description': 'Fallen trunks blocking traffic, storm branch debris, and dangerously leaning timber.', 'icon': 'Trees', 'default_department': departments['HORT'], 'base_severity': 'HIGH', 'sla_hours': 18},
        {'name': 'Public Restroom Maintenance', 'slug': 'public-toilets', 'description': 'Dysfunctional public sanitary facilities, plumbing failure, or unsanitary conditions.', 'icon': 'ShieldAlert', 'default_department': departments['HEALTH'], 'base_severity': 'MEDIUM', 'sla_hours': 24},
        {'name': 'General Infrastructure Hazards', 'slug': 'other-infrastructure', 'description': 'Damaged guardrails, missing manhole covers, collapsing footpaths, and other civic assets.', 'icon': 'HelpCircle', 'default_department': departments['PWD'], 'base_severity': 'LOW', 'sla_hours': 72},
    ]

    categories = {}
    for c in category_data:
        cat, _ = Category.objects.get_or_create(slug=c['slug'], defaults=c)
        categories[c['slug']] = cat
    print(f"Created {len(categories)} categories.")

    # 3. Users
    # Admin
    admin_user, _ = CustomUser.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@civicpulse.gov',
            'first_name': 'Chief Municipal',
            'last_name': 'Administrator',
            'role': 'ADMIN',
            'is_staff': True,
            'is_superuser': True,
            'phone_number': '+1 (555) 900-1001'
        }
    )
    admin_user.set_password('admin123')
    admin_user.save()

    # PWD Official
    official_pwd, _ = CustomUser.objects.get_or_create(
        username='official_pwd',
        defaults={
            'email': 'official.pwd@civicpulse.gov',
            'first_name': 'Marcus',
            'last_name': 'Vance',
            'role': 'OFFICIAL',
            'department': departments['PWD'],
            'phone_number': '+1 (555) 900-2001'
        }
    )
    official_pwd.set_password('pwd123')
    official_pwd.save()

    # Sanitation Official
    official_swm, _ = CustomUser.objects.get_or_create(
        username='official_swm',
        defaults={
            'email': 'official.swm@civicpulse.gov',
            'first_name': 'Elena',
            'last_name': 'Reyes',
            'role': 'OFFICIAL',
            'department': departments['SWM'],
            'phone_number': '+1 (555) 900-2002'
        }
    )
    official_swm.set_password('swm123')
    official_swm.save()

    # Water Official
    official_water, _ = CustomUser.objects.get_or_create(
        username='official_water',
        defaults={
            'email': 'official.water@civicpulse.gov',
            'first_name': 'David',
            'last_name': 'Chen',
            'role': 'OFFICIAL',
            'department': departments['BWSSB'],
            'phone_number': '+1 (555) 900-2003'
        }
    )
    official_water.set_password('water123')
    official_water.save()

    # Citizens
    citizen_1, _ = CustomUser.objects.get_or_create(
        username='citizen',
        defaults={
            'email': 'citizen@example.com',
            'first_name': 'John',
            'last_name': 'Citizen',
            'role': 'CITIZEN',
            'phone_number': '+1 (555) 300-4001',
            'address': 'Flat 402, Green Avenue, Ward 12',
            'ward_number': 'Ward 12'
        }
    )
    citizen_1.set_password('citizen123')
    citizen_1.save()

    citizen_2, _ = CustomUser.objects.get_or_create(
        username='sarah_j',
        defaults={
            'email': 'sarah.citizen@example.com',
            'first_name': 'Sarah',
            'last_name': 'Jenkins',
            'role': 'CITIZEN',
            'phone_number': '+1 (555) 300-4002',
            'address': '28 Maple Crescent, Ward 7',
            'ward_number': 'Ward 7'
        }
    )
    citizen_2.set_password('citizen123')
    citizen_2.save()

    print("Created Admin, Officials, and Citizen users.")

    # 4. Seed Realistic Complaints
    now = timezone.now()

    complaints_def = [
        {
            'complaint_id': 'CIV-2026-A101',
            'citizen': citizen_1,
            'title': 'Dangerous Deep Pothole outside Central Metro Station',
            'description': 'A deep crater roughly 1.5 meters wide has formed right before the bus bay. Two two-wheelers have slipped this morning. Requires urgent asphalt cold-mix patch.',
            'category': categories['damaged-roads'],
            'department': departments['PWD'],
            'status': 'IN_PROGRESS',
            'priority': 'CRITICAL',
            'priority_score': 88,
            'priority_factors': {'base_category_score': 32, 'user_reported_severity': 30, 'location_sensitivity': 20, 'aging_escalation': 6},
            'latitude': 12.9752,
            'longitude': 77.5985,
            'address': 'Station Road, Near Metro Gate 3',
            'landmark': 'Central Metro Station',
            'ward_zone': 'East Zone - Ward 12',
            'assigned_official': official_pwd,
            'created_days_ago': 2,
        },
        {
            'complaint_id': 'CIV-2026-B204',
            'citizen': citizen_1,
            'title': 'Massive Commercial Garbage Overflow at Market Square',
            'description': 'Three secondary waste dumpsters are spilling rotting organic waste onto the sidewalk. Stench is severe and blocking store pedestrian entrances.',
            'category': categories['garbage-accumulation'],
            'department': departments['SWM'],
            'status': 'RESOLVED',
            'priority': 'HIGH',
            'priority_score': 68,
            'priority_factors': {'base_category_score': 24, 'user_reported_severity': 22, 'location_sensitivity': 20, 'aging_escalation': 2},
            'latitude': 12.9710,
            'longitude': 77.5890,
            'address': '14 Market Street, Main Bazaar',
            'landmark': 'Opposite City Flower Market',
            'ward_zone': 'Central Zone - Ward 4',
            'assigned_official': official_swm,
            'created_days_ago': 3,
            'resolved_days_ago': 0.5,
            'resolution_action': 'Compactor truck dispatched with sanitation crew. Dumpsters emptied, sidewalk disinfected with lime powder and power-washed.',
            'resolution_material': 'Hydraulic compactor, 50kg disinfectant powder',
        },
        {
            'complaint_id': 'CIV-2026-C309',
            'citizen': citizen_2,
            'title': 'Four Consecutive Broken Streetlights Creating Dark Corridor',
            'description': 'Street poles numbered 14 to 17 along 4th Main Avenue have had their sodium vapor fixtures burnt out, resulting in pitch black conditions at night.',
            'category': categories['streetlights'],
            'department': departments['BESCOM'],
            'status': 'CLOSED',
            'priority': 'MEDIUM',
            'priority_score': 48,
            'priority_factors': {'base_category_score': 22, 'user_reported_severity': 14, 'location_sensitivity': 5, 'aging_escalation': 7},
            'latitude': 12.9680,
            'longitude': 77.6050,
            'address': '4th Main Avenue, Suburbia Enclave',
            'landmark': 'Beside St. Anne Community Church',
            'ward_zone': 'South Zone - Ward 7',
            'created_days_ago': 5,
            'resolved_days_ago': 2,
            'feedback_rating': 5,
            'feedback_comment': 'Repaired quickly with modern bright LED heads! Walking at night feels safe again. Excellent municipal service.',
        },
        {
            'complaint_id': 'CIV-2026-D412',
            'citizen': citizen_2,
            'title': 'High Pressure Potable Water Pipeline Rupture Flooding Alley',
            'description': 'Main supply line has ruptured under the curb. Clean drinking water is gushing out and eroding the foundation wall of adjacent residential building.',
            'category': categories['water-leakage'],
            'department': departments['BWSSB'],
            'status': 'ASSIGNED',
            'priority': 'HIGH',
            'priority_score': 74,
            'priority_factors': {'base_category_score': 35, 'user_reported_severity': 30, 'location_sensitivity': 5, 'aging_escalation': 4},
            'latitude': 12.9820,
            'longitude': 77.5910,
            'address': 'Crossroad 9, Green Park Colony',
            'landmark': 'Near Municipal Overhead Water Tank',
            'ward_zone': 'North Zone - Ward 3',
            'assigned_official': official_water,
            'created_days_ago': 1,
        },
        {
            'complaint_id': 'CIV-2026-E518',
            'citizen': citizen_1,
            'title': 'Traffic Signal Failure at Busy 5-Way Ring Road Junction',
            'description': 'Signals are completely blank due to junction feeder fuse trip. Traffic is in total gridlock with near collisions occurring every few minutes.',
            'category': categories['traffic-signals'],
            'department': departments['TRAFFIC'],
            'status': 'REPORTED',
            'priority': 'CRITICAL',
            'priority_score': 92,
            'priority_factors': {'base_category_score': 42, 'user_reported_severity': 30, 'location_sensitivity': 20, 'aging_escalation': 0},
            'latitude': 12.9640,
            'longitude': 77.5810,
            'address': 'Junction of Ring Road & Hospital Parkway',
            'landmark': 'District General Hospital Crossing',
            'ward_zone': 'West Zone - Ward 15',
            'created_days_ago': 0.2,
        },
        {
            'complaint_id': 'CIV-2026-F625',
            'citizen': citizen_2,
            'title': 'Large Gulmohar Tree Branch Snapped Across Power Cable',
            'description': 'Heavy monsoon winds snapped a 6-meter tree bough which is now resting squarely on active overhead cables, bending the utility pole.',
            'category': categories['fallen-trees'],
            'department': departments['HORT'],
            'status': 'VERIFIED',
            'priority': 'HIGH',
            'priority_score': 70,
            'priority_factors': {'base_category_score': 18, 'user_reported_severity': 30, 'location_sensitivity': 20, 'aging_escalation': 2},
            'latitude': 12.9890,
            'longitude': 77.6100,
            'address': 'Lake Boulevard, Boulevard Park',
            'landmark': 'North Gate of Public Botanical Garden',
            'ward_zone': 'East Zone - Ward 18',
            'created_days_ago': 1.5,
        },
        {
            'complaint_id': 'CIV-2026-G730',
            'citizen': citizen_2,
            'title': 'Road crater right in front of Metro entrance gate',
            'description': 'There is a big pothole that broke open recently right in front of the Central Metro station bus stop lane. Very risky for bikes.',
            'category': categories['damaged-roads'],
            'department': departments['PWD'],
            'status': 'REPORTED',
            'priority': 'HIGH',
            'priority_score': 66,
            'latitude': 12.9754,
            'longitude': 77.5988,
            'address': 'Station Road, Near Metro Gate 3',
            'landmark': 'Central Metro Station',
            'ward_zone': 'East Zone - Ward 12',
            'created_days_ago': 0.1,
            'is_duplicate_flag': True,
            'duplicate_similarity_score': 0.86,
        },
        {
            'complaint_id': 'CIV-2026-H844',
            'citizen': citizen_1,
            'title': 'Public Restroom Block Drainage Clogged & Overflowing',
            'description': 'Community toilet complex at the bus terminal has severe sewer blockage. Sewage is backflowing onto entrance ramp.',
            'category': categories['public-toilets'],
            'department': departments['HEALTH'],
            'status': 'REOPENED',
            'priority': 'HIGH',
            'priority_score': 72,
            'priority_factors': {'base_category_score': 20, 'user_reported_severity': 22, 'location_sensitivity': 15, 'reopened_escalation': 15},
            'latitude': 12.9695,
            'longitude': 77.5930,
            'address': 'Terminal Bus Depot Complex',
            'landmark': 'Platform Bay 1 Restroom',
            'ward_zone': 'Central Zone - Ward 2',
            'created_days_ago': 4,
        }
    ]

    complaint_objects = {}
    for comp in complaints_def:
        c_obj, created = Complaint.objects.get_or_create(
            complaint_id=comp['complaint_id'],
            defaults={
                'citizen': comp['citizen'],
                'title': comp['title'],
                'description': comp['description'],
                'category': comp['category'],
                'department': comp['department'],
                'status': comp['status'],
                'priority': comp['priority'],
                'priority_score': comp['priority_score'],
                'priority_factors': comp.get('priority_factors', {}),
                'latitude': comp['latitude'],
                'longitude': comp['longitude'],
                'address': comp['address'],
                'landmark': comp['landmark'],
                'ward_zone': comp['ward_zone'],
                'assigned_official': comp.get('assigned_official'),
                'is_duplicate_flag': comp.get('is_duplicate_flag', False),
                'duplicate_similarity_score': comp.get('duplicate_similarity_score'),
                'created_at': now - timedelta(days=comp['created_days_ago']),
            }
        )
        complaint_objects[comp['complaint_id']] = c_obj

        # Link duplicate
        if comp.get('is_duplicate_flag') and 'CIV-2026-A101' in complaint_objects:
            c_obj.duplicate_of = complaint_objects['CIV-2026-A101']
            c_obj.save()
            DuplicateDetectionLog.objects.get_or_create(
                new_complaint=c_obj,
                matched_complaint=complaint_objects['CIV-2026-A101'],
                defaults={
                    'geo_distance_meters': 38.4,
                    'text_similarity_score': 0.79,
                    'category_match': True,
                    'combined_score': 0.86,
                    'review_status': 'PENDING'
                }
            )

        # Status History
        ComplaintStatusHistory.objects.get_or_create(
            complaint=c_obj,
            to_status='REPORTED',
            defaults={
                'from_status': None,
                'changed_by': comp['citizen'],
                'remarks': 'Complaint initially reported by citizen.',
                'changed_at': c_obj.created_at
            }
        )

        if comp['status'] in ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED']:
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='VERIFIED',
                defaults={
                    'from_status': 'REPORTED',
                    'changed_by': admin_user,
                    'remarks': 'Issue inspected and verified by municipal administrator.',
                    'changed_at': c_obj.created_at + timedelta(hours=3)
                }
            )

        if comp['status'] in ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED']:
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='ASSIGNED',
                defaults={
                    'from_status': 'VERIFIED',
                    'changed_by': admin_user,
                    'remarks': f"Assigned to {comp['department'].name}.",
                    'changed_at': c_obj.created_at + timedelta(hours=5)
                }
            )

        if comp['status'] in ['IN_PROGRESS', 'RESOLVED', 'CLOSED']:
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='IN_PROGRESS',
                defaults={
                    'from_status': 'ASSIGNED',
                    'changed_by': comp.get('assigned_official') or admin_user,
                    'remarks': 'Field crew dispatched on-site. Repair operations initiated.',
                    'changed_at': c_obj.created_at + timedelta(hours=8)
                }
            )

        if comp.get('resolution_action'):
            res_rec, _ = ResolutionRecord.objects.get_or_create(
                complaint=c_obj,
                defaults={
                    'resolved_by': comp.get('assigned_official') or admin_user,
                    'action_taken': comp['resolution_action'],
                    'material_used': comp.get('resolution_material', 'Standard municipal materials'),
                    'resolved_at': now - timedelta(days=comp.get('resolved_days_ago', 1))
                }
            )
            c_obj.resolved_at = res_rec.resolved_at
            c_obj.save()
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='RESOLVED',
                defaults={
                    'from_status': 'IN_PROGRESS',
                    'changed_by': comp.get('assigned_official') or admin_user,
                    'remarks': f"Official resolution: {comp['resolution_action']}",
                    'changed_at': res_rec.resolved_at
                }
            )

        if comp.get('feedback_rating'):
            c_obj.status = 'CLOSED'
            c_obj.closed_at = now - timedelta(days=comp.get('resolved_days_ago', 1))
            c_obj.save()
            CitizenFeedback.objects.get_or_create(
                complaint=c_obj,
                defaults={
                    'citizen': comp['citizen'],
                    'rating': comp['feedback_rating'],
                    'comment': comp.get('feedback_comment', ''),
                    'is_satisfied': True,
                    'submitted_at': c_obj.closed_at
                }
            )
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='CLOSED',
                defaults={
                    'from_status': 'RESOLVED',
                    'changed_by': comp['citizen'],
                    'remarks': f"Citizen verified resolution and provided {comp['feedback_rating']}-star feedback.",
                    'changed_at': c_obj.closed_at
                }
            )

        if comp['status'] == 'REOPENED':
            ComplaintStatusHistory.objects.get_or_create(
                complaint=c_obj,
                to_status='REOPENED',
                defaults={
                    'from_status': 'RESOLVED',
                    'changed_by': comp['citizen'],
                    'remarks': 'Citizen reported: Overflow resumed after only 2 hours. Drain line remains partially choked.',
                    'changed_at': now - timedelta(hours=12)
                }
            )

        # Seed initial notification
        Notification.objects.get_or_create(
            recipient=comp['citizen'],
            complaint=c_obj,
            title=f"Update on {c_obj.complaint_id}",
            defaults={
                'message': f"Complaint '{c_obj.title}' is currently marked as {c_obj.get_status_display()}.",
                'notification_type': 'STATUS_CHANGE',
                'is_read': False,
                'created_at': now - timedelta(hours=4)
            }
        )

    print(f"Successfully seeded {len(complaints_def)} complaints with timeline histories, feedback, and duplicates!")

if __name__ == '__main__':
    seed_database()
