from rest_framework.routers import SimpleRouter
from notifications.views import NotificationViewSet

app_name = 'notifications'

router = SimpleRouter()
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = router.urls
