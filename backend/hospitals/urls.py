from rest_framework_nested import routers

from hospitals.views import HospitalViewSet, ServiceViewSet

app_name = 'hospitals'

router = routers.SimpleRouter()
router.register(r'', HospitalViewSet, basename='hospital')

services_router = routers.NestedSimpleRouter(router, r'', lookup='hospital')
services_router.register(r'services', ServiceViewSet, basename='hospital-services')

urlpatterns = router.urls + services_router.urls
