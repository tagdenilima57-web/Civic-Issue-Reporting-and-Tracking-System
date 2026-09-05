import jwt
from datetime import datetime, timedelta, timezone
from django.conf import settings
from rest_framework import authentication, exceptions
from .models import CustomUser

def generate_jwt_token(user):
    """Generate a signed JWT token with user info and expiry."""
    payload = {
        'user_id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'department_id': user.department_id,
        'department_name': user.department.name if user.department else None,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'iat': datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')


def decode_jwt_token(token):
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise exceptions.AuthenticationFailed('Token has expired. Please log in again.')
    except jwt.InvalidTokenError:
        raise exceptions.AuthenticationFailed('Invalid authentication token.')


class JWTTokenAuthentication(authentication.BaseAuthentication):
    """Custom DRF authentication supporting 'Bearer <token>' headers."""
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None

        token = parts[1]
        payload = decode_jwt_token(token)

        try:
            user = CustomUser.objects.select_related('department').get(id=payload['user_id'])
            if not user.is_active:
                raise exceptions.AuthenticationFailed('User account is deactivated.')
            return (user, token)
        except CustomUser.DoesNotExist:
            raise exceptions.AuthenticationFailed('No user associated with this token.')
