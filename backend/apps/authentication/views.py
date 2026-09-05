from rest_framework import status, views, viewsets, permissions
from rest_framework.response import Response
from .models import CustomUser, Department
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer, DepartmentSerializer
from .backends import generate_jwt_token

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token = generate_jwt_token(user)
            return Response({
                'message': 'Registration successful',
                'user': UserSerializer(user).data,
                'token': token
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token = generate_jwt_token(user)
            return Response({
                'message': 'Login successful',
                'user': UserSerializer(user).data,
                'token': token
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(views.APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]  # Admin restricted in UI/business logic
