from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from accounts.models.user import User
from accounts.serializers.password import (
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    PasswordChangeSerializer,
)
from accounts.utils.password_reset import (
    send_password_reset_email,
    validate_reset_token,
)


class PasswordResetRequestView(APIView):
    """
    Request a password reset by providing email address.
    Sends a password reset link to the email if it exists.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Request Password Reset",
        operation_description="Request a password reset link to be sent to your email. "
                            "For security, the endpoint will return success even if the email doesn't exist.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_EMAIL, description='Your registered email address')
            },
            required=['email']
        ),
        responses={
            200: openapi.Response(
                description='Password reset email sent (or would have been if email exists)',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: 'Invalid email format'
        }
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
            send_password_reset_email(user, request)
        except User.DoesNotExist:
            # For security, don't reveal if email exists
            pass
        
        return Response(
            {'message': 'If an account exists with this email, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )


class PasswordResetConfirmView(APIView):
    """
    Confirm password reset using the token received via email.
    User provides the reset token, new password, and password confirmation.
    """
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Reset Password with Token",
        operation_description="Complete the password reset process with a valid reset token.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'token': openapi.Schema(type=openapi.TYPE_STRING, description='Password reset token from email'),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD, description='New password (minimum 8 characters)'),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD, description='Confirm new password')
            },
            required=['token', 'new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response(
                description='Password reset successful',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: 'Invalid token or passwords do not match',
            401: 'Token has expired or is invalid'
        }
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        # Validate token
        is_valid, token_obj, error_message = validate_reset_token(token)
        
        if not is_valid:
            return Response(
                {'error': error_message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user's password
        user = token_obj.user
        user.set_password(new_password)
        user.save()
        
        # Mark token as used
        token_obj.is_used = True
        token_obj.save()
        
        return Response(
            {'message': 'Password has been reset successfully. You can now login with your new password.'},
            status=status.HTTP_200_OK
        )


class PasswordChangeView(APIView):
    """
    Change password for authenticated users.
    User must provide old password, new password, and password confirmation.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Change Password (Authenticated User)",
        operation_description="Change your password. Requires authentication and the old password.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'old_password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD, description='Your current password'),
                'new_password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD, description='New password (minimum 8 characters)'),
                'confirm_password': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_PASSWORD, description='Confirm new password')
            },
            required=['old_password', 'new_password', 'confirm_password']
        ),
        responses={
            200: openapi.Response(
                description='Password changed successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'message': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                )
            ),
            400: 'Invalid password or validation error',
            401: 'Unauthorized - authentication required'
        }
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Update password
        user.set_password(new_password)
        user.save()
        
        return Response(
            {'message': 'Password has been changed successfully.'},
            status=status.HTTP_200_OK
        )
