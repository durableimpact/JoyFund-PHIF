"""
WebSocket URL routing with Chanx framework.

Uses Chanx routing utilities for clean, modular WebSocket endpoint definitions.
"""

from channels.routing import URLRouter
from chanx.channels.routing import path
from backend.consumers import DonationConsumer, NotificationConsumer

websocket_urlpatterns = [
    path("ws/donations/", DonationConsumer.as_asgi()),
    path("ws/notifications/", NotificationConsumer.as_asgi()),
]
