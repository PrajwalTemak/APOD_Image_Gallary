from __future__ import annotations

from django.shortcuts import render

# Create your views here.
# apod/views.py
import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .nasa_client import fetch_apod
from .cache import get_cache, set_cache
from .serializers import APODSerializer

logger = logging.getLogger(__name__)

CACHE_PREFIX = "apod"

def cache_key_for_date(date_str: str | None) -> str:
    return "today" if not date_str else date_str

@api_view(["GET"])
def apod_today(request):
    """
    GET /api/apod/today  -> today's APOD (cached)
    """
    key = cache_key_for_date(None)
    cached = get_cache(CACHE_PREFIX, key)
    if cached:
        return Response(cached)

    try:
        raw = fetch_apod(date=None)
    except RuntimeError as exc:
        logger.exception("Failed to fetch today's APOD")
        return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    serializer = APODSerializer(data=raw)
    serializer.is_valid(raise_exception=False)
    payload = serializer.to_representation(raw)
    set_cache(CACHE_PREFIX, key, payload)
    return Response(payload)

@api_view(["GET"])
def apod_by_date(request):
    """
    GET /api/apod?date=YYYY-MM-DD
    """
    date = request.query_params.get("date")
    if not date:
        return Response({"error": "Missing date parameter"}, status=status.HTTP_400_BAD_REQUEST)

    key = cache_key_for_date(date)
    cached = get_cache(CACHE_PREFIX, key)
    if cached:
        return Response(cached)

    try:
        raw = fetch_apod(date=date)
    except RuntimeError as exc:
        logger.exception("Failed to fetch APOD for date=%s", date)
        return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    payload = APODSerializer().to_representation(raw)
    set_cache(CACHE_PREFIX, key, payload)
    return Response(payload)

@api_view(["GET"])
def apod_recent(request):
    """
    GET /api/apod/recent?days=10
    Returns APODs for recent N days including today.
    Note: This will call NASA for dates missing in cache up to N calls — be mindful of rate limits.
    """
    try:
        days = int(request.query_params.get("days", "10"))
        if days < 1 or days > 100:
            raise ValueError()
    except ValueError:
        return Response({"error": "days must be integer between 1 and 100"}, status=status.HTTP_400_BAD_REQUEST)

    from datetime import date, timedelta
    results = []
    today = date.today()
    for i in range(days):
        dt = today - timedelta(days=i)
        key = cache_key_for_date(dt.isoformat())
        cached = get_cache(CACHE_PREFIX, key)
        if cached:
            results.append(cached)
            continue
        # fetch
        try:
            raw = fetch_apod(date=dt.isoformat())
            payload = APODSerializer().to_representation(raw)
            set_cache(CACHE_PREFIX, key, payload)
            results.append(payload)
        except RuntimeError as exc:
            logger.exception("Failed to fetch APOD for %s: %s", dt.isoformat(), exc)
            # append a placeholder so UI can show something for that date
            results.append({"date": dt.isoformat(), "error": str(exc)})

    return Response(results)

@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})
