# apod/serializers.py
from rest_framework import serializers

class APODSerializer(serializers.Serializer):
    date = serializers.CharField()
    title = serializers.CharField(allow_blank=True, required=False)
    explanation = serializers.CharField(allow_blank=True, required=False)
    media_type = serializers.CharField()
    url = serializers.CharField(allow_blank=True, required=False)
    hdurl = serializers.CharField(allow_blank=True, required=False)
    copyright = serializers.CharField(allow_blank=True, required=False)

    def to_representation(self, instance):
        # instance: the raw payload from NASA
        media_type = instance.get("media_type")
        # prefer hdurl for images when present
        media_url = None
        if media_type == "image":
            media_url = instance.get("hdurl") or instance.get("url")
        elif media_type == "video":
            media_url = instance.get("url")
        else:
            media_url = instance.get("url")

        return {
            "date": instance.get("date"),
            "title": instance.get("title"),
            "explanation": instance.get("explanation"),
            "media_type": media_type,
            "media_url": media_url,
            "copyright": instance.get("copyright"),
            # Keep minimal: omit raw fields if not needed
        }
