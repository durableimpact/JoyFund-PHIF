from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone

from accounts.models.user import User
from accounts.models.verification import EmailVerificationToken
from accounts.utils.verification import send_verification_email

class VerifyEmailView(APIView):
    """
    Verify a user's email using the 6-digit OTP sent to their email.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=['Email Verification'],
        operation_summary="Verify Email OTP",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL),
                'code': openapi.Schema(type=openapi.TYPE_STRING, description="6-digit OTP")
            },
            required=['email', 'code']
        ),
        responses={200: "Email verified successfully", 400: "Invalid or expired code"}
    )
    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')

        if not email or not code:
            return Response({'error': 'Email and verification code are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_verified:
            return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

        # Get latest verification code
        verification = EmailVerificationToken.objects.filter(user=user).order_by('-created_at').first()

        if not verification or verification.code != str(code):
            return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

        if not verification.is_valid:
            return Response({'error': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        # Token is valid, mark user as verified
        user.is_verified = True
        user.save()
        
        # Cleanup used tokens
        EmailVerificationToken.objects.filter(user=user).delete()

        return Response({'message': 'Email verified successfully!'}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    """
    Resend the verification email to the user.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=['Email Verification'],
        operation_summary="Resend Verification Email",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL)
            },
            required=['email']
        ),
        responses={200: "Email sent", 400: "User already verified or not found"}
    )
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found with this email.'}, status=status.HTTP_404_NOT_FOUND)

        if user.is_verified:
            return Response({'error': 'User is already verified.'}, status=status.HTTP_400_BAD_REQUEST)

        # Rate limiting logic could go here, but omitted for simplicity
        
        send_verification_email(user)
        return Response({'message': 'Verification email has been sent.'}, status=status.HTTP_200_OK)
