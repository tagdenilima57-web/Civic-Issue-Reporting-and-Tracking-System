from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Department

class DepartmentSerializer(serializers.ModelSerializer):
    official_count = serializers.IntegerField(source='officials.count', read_only=True)
    open_complaints_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'description', 'contact_email', 'contact_phone', 'is_active', 'created_at', 'official_count', 'open_complaints_count']

    def get_open_complaints_count(self, obj):
        return obj.complaints.exclude(status__in=['RESOLVED', 'CLOSED']).count() if hasattr(obj, 'complaints') else 0


class UserSerializer(serializers.ModelSerializer):
    department_details = DepartmentSerializer(source='department', read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone_number', 'address', 'ward_number', 'department', 'department_details', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'address', 'ward_number', 'role', 'department']

    def create(self, validated_data):
        password = validated_data.pop('password')
        role = validated_data.get('role', 'CITIZEN')
        # Only admins can create admin or official accounts if authenticated, otherwise citizens
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username_or_email')
        password = attrs.get('password')

        user = None
        if '@' in username_or_email:
            try:
                user_obj = CustomUser.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except CustomUser.DoesNotExist:
                pass
        else:
            user = authenticate(username=username_or_email, password=password)

        if not user:
            raise serializers.ValidationError('Invalid login credentials. Please check your username/email and password.')
        if not user.is_active:
            raise serializers.ValidationError('Account is suspended or deactivated.')

        attrs['user'] = user
        return attrs
