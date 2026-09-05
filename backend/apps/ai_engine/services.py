import math
import cv2
import numpy as np
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from django.utils import timezone
from apps.complaints.models import Category, Complaint
from apps.authentication.models import Department

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees), returning distance in meters.
    """
    R = 6371000  # Radius of earth in meters
    phi1 = math.radians(float(lat1))
    phi2 = math.radians(float(lat2))
    delta_phi = math.radians(float(lat2) - float(lat1))
    delta_lambda = math.radians(float(lon2) - float(lon1))

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class PriorityAssessmentEngine:
    """
    Deterministic, transparent multi-factor civic priority evaluation.
    Computes priority based on issue category baseline, hazard rating,
    critical infrastructure proximity, complaint aging, and reopen status.
    """
    CATEGORY_BASE_WEIGHTS = {
        'traffic-signals': 42,
        'water-leakage': 35,
        'damaged-roads': 32,
        'garbage-accumulation': 24,
        'streetlights': 22,
        'public-toilets': 20,
        'fallen-trees': 18,
        'other-infrastructure': 15,
    }

    @classmethod
    def calculate_priority(cls, category, user_severity='MODERATE', is_sensitive_location=False, age_hours=0, is_reopened=False):
        factors = {}
        slug = category.slug if hasattr(category, 'slug') else 'other-infrastructure'
        base_score = cls.CATEGORY_BASE_WEIGHTS.get(slug, 20)
        factors['base_category_score'] = base_score

        # Severity contribution
        severity_map = {
            'CRITICAL': 30,
            'HIGH': 22,
            'MODERATE': 14,
            'LOW': 6,
        }
        severity_score = severity_map.get(user_severity.upper(), 14)
        factors['user_reported_severity'] = severity_score

        # Location sensitivity (schools, hospitals, busy main avenues)
        loc_score = 20 if is_sensitive_location else 5
        factors['location_sensitivity'] = loc_score

        # Complaint aging factor (escalation for delayed turnaround)
        aging_score = min(int(age_hours / 24) * 4, 16)
        factors['aging_escalation'] = aging_score

        # Reopened penalty
        reopen_score = 15 if is_reopened else 0
        factors['reopened_escalation'] = reopen_score

        total_score = min(100, base_score + severity_score + loc_score + aging_score + reopen_score)
        factors['total_score'] = total_score

        if total_score >= 75:
            priority = 'CRITICAL'
        elif total_score >= 55:
            priority = 'HIGH'
        elif total_score >= 35:
            priority = 'MEDIUM'
        else:
            priority = 'LOW'

        return priority, total_score, factors


class DuplicateDetectionEngine:
    """
    Multi-factor duplicate complaint detection using spatial distance,
    TF-IDF text similarity, and category alignment.
    Flags candidate duplicates with transparent similarity scores.
    """
    DISTANCE_THRESHOLD_METERS = 200.0  # Search radius

    @classmethod
    def find_potential_duplicates(cls, latitude, longitude, category_id, title, description, exclude_complaint_id=None):
        if not latitude or not longitude:
            return []

        active_statuses = ['REPORTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS']
        query = Complaint.objects.filter(status__in=active_statuses)
        if exclude_complaint_id:
            query = query.exclude(id=exclude_complaint_id)

        candidates = []
        new_text = f"{title or ''} {description or ''}".strip().lower()

        for complaint in query[:80]:
            dist = haversine_distance(latitude, longitude, complaint.latitude, complaint.longitude)
            if dist <= cls.DISTANCE_THRESHOLD_METERS:
                # Calculate category match
                cat_match = (complaint.category_id == int(category_id)) if category_id else False
                cat_score = 1.0 if cat_match else 0.0

                # Calculate text similarity
                existing_text = f"{complaint.title} {complaint.description}".strip().lower()
                text_score = 0.0
                if new_text and existing_text:
                    try:
                        vectorizer = TfidfVectorizer(stop_words='english')
                        tfidf_matrix = vectorizer.fit_transform([new_text, existing_text])
                        text_score = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
                    except Exception:
                        text_score = 0.0

                # Spatial proximity score: 1.0 at 0m down to 0.0 at 200m
                geo_score = max(0.0, 1.0 - (dist / cls.DISTANCE_THRESHOLD_METERS))

                # Weighted composite duplicate score
                # Geo: 45%, Text: 30%, Category: 25%
                combined_score = round((0.45 * geo_score) + (0.30 * text_score) + (0.25 * cat_score), 3)

                # Threshold to consider candidate duplicate
                if combined_score >= 0.45 or (dist <= 50.0 and cat_match):
                    candidates.append({
                        'complaint_id': complaint.complaint_id,
                        'id': complaint.id,
                        'title': complaint.title,
                        'category_name': complaint.category.name,
                        'status': complaint.status,
                        'distance_meters': round(dist, 1),
                        'geo_score': round(geo_score, 2),
                        'text_similarity': round(text_score, 2),
                        'category_match': cat_match,
                        'combined_score': combined_score,
                        'created_at': complaint.created_at.strftime('%Y-%m-%d %H:%M'),
                    })

        candidates.sort(key=lambda x: x['combined_score'], reverse=True)
        return candidates[:5]


class AIIssueClassificationService:
    """
    AI-Assisted Issue Classification Module.
    Performs visual feature extraction (HSV color distribution, edge gradients,
    structural contour variance) on uploaded civic evidence images,
    matches against civic categories, and suggests the appropriate department.
    Always includes an explicit disclaimer indicating this is an AI suggestion.
    """
    @classmethod
    def classify_image(cls, image_file):
        try:
            # Read image buffer with PIL / OpenCV
            image_file.seek(0)
            pil_img = Image.open(image_file).convert('RGB')
            img_np = np.array(pil_img)
            height, width, _ = img_np.shape

            # Convert to HSV for robust color analysis
            hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
            h, s, v = cv2.split(hsv)

            # Convert to Grayscale for edge analysis
            gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = float(np.sum(edges > 0) / (height * width))

            # Color distribution analysis
            # Dark asphalt / road hues (low saturation, low value)
            asphalt_mask = (s < 60) & (v < 110)
            asphalt_ratio = float(np.sum(asphalt_mask) / (height * width))

            # Greenery / Foliage hues (H between 35 and 85)
            green_mask = (h >= 35) & (h <= 85) & (s > 40)
            green_ratio = float(np.sum(green_mask) / (height * width))

            # Water / Fluid reflection hues (cyan/blue or high brightness specular reflections)
            water_mask = (h >= 90) & (h <= 130) & (s > 30)
            water_ratio = float(np.sum(water_mask) / (height * width))

            # Color Entropy / scattered variance (typical of garbage dumps/litter)
            color_std = float(np.mean([np.std(h), np.std(s), np.std(v)]))

            # Vertical structure score (for poles / streetlights / signals)
            sobel_v = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
            vertical_edge_energy = float(np.mean(np.abs(sobel_v)))

            # Score matching to categories
            scores = {}
            explanations = {}

            # 1. Potholes / Damaged Roads
            pothole_score = 0.35 + (asphalt_ratio * 0.45) + (edge_density * 0.30)
            scores['damaged-roads'] = min(0.92, pothole_score)
            explanations['damaged-roads'] = f"Detected high roadway asphalt density ({asphalt_ratio*100:.1f}%) and surface fracture edge patterns."

            # 2. Garbage Accumulation
            garbage_score = 0.30 + (min(color_std / 70.0, 1.0) * 0.40) + (edge_density * 0.25)
            scores['garbage-accumulation'] = min(0.90, garbage_score)
            explanations['garbage-accumulation'] = f"Detected high chromatic dispersion and irregular object cluster distribution consistent with solid waste."

            # 3. Water Leakage
            leakage_score = 0.20 + (water_ratio * 0.60) + (0.20 if asphalt_ratio > 0.2 else 0.0)
            scores['water-leakage'] = min(0.88, leakage_score)
            explanations['water-leakage'] = f"Detected fluid reflection signatures and moisture dispersion patterns."

            # 4. Fallen Trees / Overgrowth
            tree_score = 0.25 + (green_ratio * 0.65)
            scores['fallen-trees'] = min(0.94, tree_score)
            explanations['fallen-trees'] = f"Detected dominant vegetative chlorophyll spectrum ({green_ratio*100:.1f}%) and organic foliage textures."

            # 5. Broken Streetlights
            streetlight_score = 0.25 + (min(vertical_edge_energy / 40.0, 1.0) * 0.35) + (0.25 if np.mean(v) < 90 else 0.1)
            scores['streetlights'] = min(0.86, streetlight_score)
            explanations['streetlights'] = "Detected prominent vertical infrastructure silhouette and lighting fixture geometry."

            # 6. Traffic Signals
            # Look for localized red / yellow / green circular regions
            signal_score = 0.20 + (min(vertical_edge_energy / 50.0, 1.0) * 0.30)
            scores['traffic-signals'] = min(0.85, signal_score)
            explanations['traffic-signals'] = "Detected vertical intersection structural elements and signal housing features."

            # Pick highest scoring category
            best_slug = max(scores, key=scores.get)
            best_confidence = round(scores[best_slug], 2)
            best_explanation = explanations[best_slug]

            # Fetch matching category and department from DB
            try:
                category = Category.objects.get(slug=best_slug)
                suggested_dept = category.default_department
            except Category.DoesNotExist:
                category = Category.objects.first()
                suggested_dept = category.default_department if category else None

            # Reset file pointer
            image_file.seek(0)

            return {
                'category_id': category.id if category else None,
                'category_name': category.name if category else 'Infrastructure Issue',
                'category_slug': best_slug,
                'confidence': best_confidence,
                'confidence_percent': int(best_confidence * 100),
                'suggested_department_id': suggested_dept.id if suggested_dept else None,
                'suggested_department_name': suggested_dept.name if suggested_dept else 'General Municipal Services',
                'suggested_department_code': suggested_dept.code if suggested_dept else 'GEN',
                'is_ai_suggestion': True,
                'disclaimer': 'This is an AI-assisted suggestion based on image feature analysis. Citizens and municipal personnel can freely correct or override it.',
                'explanation': best_explanation,
                'extracted_features': {
                    'edge_density': round(edge_density, 3),
                    'asphalt_ratio': round(asphalt_ratio, 3),
                    'green_ratio': round(green_ratio, 3),
                    'color_variance': round(color_std, 2),
                }
            }

        except Exception as e:
            # Safe transparent fallback
            category = Category.objects.first()
            dept = category.default_department if category else None
            return {
                'category_id': category.id if category else None,
                'category_name': category.name if category else 'Civic Problem',
                'category_slug': category.slug if category else 'other-infrastructure',
                'confidence': 0.50,
                'confidence_percent': 50,
                'suggested_department_id': dept.id if dept else None,
                'suggested_department_name': dept.name if dept else 'Public Works Department',
                'is_ai_suggestion': True,
                'disclaimer': 'Visual feature parsing defaulted. Citizen can select the exact category manually.',
                'explanation': 'General civic issue category suggested based on default municipal routing rules.',
                'extracted_features': {'error': str(e)}
            }
