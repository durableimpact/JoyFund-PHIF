from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from newsletter.models import Subscriber
from newsletter.serializers import SubscriberSerializer
from newsletter.tasks import send_newsletter_subscription_emails

_TAG = ["Newsletter"]


class NewsletterSubscribeView(APIView):
    """
    Subscribe a user to the JoyFund newsletter.

    - POST /api/newsletter/subscribe/  { "email": "..." }

    On success, a welcome email is sent to the subscriber and the admin is
    notified about the new subscription.
    """

    permission_classes = [AllowAny]

    @swagger_auto_schema(
        tags=_TAG,
        request_body=SubscriberSerializer,
        responses={
            201: openapi.Response(
                description="Subscribed successfully",
                schema=SubscriberSerializer,
            ),
            400: openapi.Response(description="Invalid email address"),
        },
    )
    def post(self, request, *args, **kwargs):
        serializer = SubscriberSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]

        subscriber, created = Subscriber.objects.get_or_create(
            email=email,
            defaults={"is_active": True},
        )

        # If the user unsubscribed previously, re-activate them.
        if not subscriber.is_active:
            subscriber.is_active = True
            subscriber.save(update_fields=["is_active", "updated_at"])

        send_newsletter_subscription_emails(email)

        return Response(
            SubscriberSerializer(subscriber).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
