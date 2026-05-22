from django.conf import settings
from rest_framework import serializers


class StaffSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    name = serializers.CharField()
    email = serializers.EmailField()
    profile_picture = serializers.SerializerMethodField()
    is_active = serializers.BooleanField()
    role = serializers.CharField()

    def get_profile_picture(self, obj):
        request = self.context.get("request")
        if not request:
            return None

        # Handle both dictionary and object representations
        if isinstance(obj, dict):
            profile_picture = obj.get("profile_picture")
        else:
            profile_picture = getattr(obj, "profile_picture", None)

        if not profile_picture:
            return None

        # Resolve filename
        if isinstance(profile_picture, str):
            file_name = profile_picture
        else:
            file_name = getattr(profile_picture, "name", str(profile_picture))

        if not file_name:
            return None

        # Concat server URL with media path and file name
        media_url = settings.MEDIA_URL
        if not media_url.startswith("/"):
            media_url = "/" + media_url
        if not media_url.endswith("/"):
            media_url = media_url + "/"

        if file_name.startswith(media_url):
            relative_path = file_name
        elif file_name.startswith("/" + settings.MEDIA_URL):
            relative_path = file_name
        else:
            relative_path = media_url + file_name.lstrip("/")

        return request.build_absolute_uri(relative_path)
