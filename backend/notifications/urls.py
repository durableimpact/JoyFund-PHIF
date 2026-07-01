from django.urls import path
from rest_framework.routers import SimpleRouter
from notifications.views import NotificationViewSet
from notifications.views_push import (
    register_push_subscription,
    unregister_push_subscription,
    list_push_subscriptions,
    test_send_push,
    push_task_status,
)

app_name = 'notifications'

router = SimpleRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = router.urls + [
    path("push/register/", register_push_subscription, name="push-register"),
    path("push/unregister/", unregister_push_subscription, name="push-unregister"),
    path("push/subscriptions/", list_push_subscriptions, name="push-subscriptions"),
    path("push/test-send/", test_send_push, name="push-test-send"),
    path("push/task/<uuid:task_id>/", push_task_status, name="push-task-status"),
]
