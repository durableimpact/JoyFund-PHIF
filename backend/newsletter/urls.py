from django.urls import path

from newsletter.views import NewsletterSubscribeView

app_name = "newsletter"

urlpatterns = [
    path("subscribe/", NewsletterSubscribeView.as_view(), name="subscribe"),
]
