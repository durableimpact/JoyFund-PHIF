"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from accounts.views.auth_token import refresh_token_handler
from chanx.channels import urls as chanx_urls
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from .views import login_view, logout_view, oauth2_token_view

schema_view = get_schema_view(
    openapi.Info(
        title="JoyFund PHIF API",
        default_version="v1",
        description="JoyFund People Health Insurance Fund - REST API documentation",
        contact=openapi.Contact(email="ivan.tomdieu@gmail.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=settings.DEBUG,
    permission_classes=(
        (permissions.AllowAny,) if settings.DEBUG else (permissions.IsAuthenticated,)
    ),
)

# Standard Django Error Handlers to prevent Celery startup errors
handler400 = "django.views.defaults.bad_request"
handler403 = "django.views.defaults.permission_denied"
handler404 = "django.views.defaults.page_not_found"
handler500 = "django.views.defaults.server_error"

urlpatterns = [
    path("", TemplateView.as_view(template_name="landing.html"), name="landing"),
    path("login/", login_view, name="login"),
    path("accounts/logout/", logout_view, name="logout"),
    path("admin/", admin.site.urls),
    # Prometheus Metrics
    path("", include("django_prometheus.urls")),
    # WebSocket AsyncAPI Documentation (Chanx)
    path("asyncapi/", include(chanx_urls.urlpatterns)),
    # API endpoints
    # OAuth2 authentication with rate limiting
    # ✓ Rate limited token endpoint: 10 requests/hour (password & client_credentials grants)
    path("auth/token/", oauth2_token_view, name="oauth2_token"),
    # ✓ Dedicated refresh token endpoint (refresh_token grant)
    path("auth/refresh/", refresh_token_handler, name="auth_refresh"),
    # Include remaining drf-social-oauth2 endpoints (convert-token, refresh, etc.)
    path("auth/", include("drf_social_oauth2.urls", namespace="drf")),
    # Versioned API
    path("api/", include("backend.api.urls")),
    # API documentation
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
]

# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# else:
urlpatterns += [
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
