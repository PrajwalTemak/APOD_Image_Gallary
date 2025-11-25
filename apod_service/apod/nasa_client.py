# apod/nasa_client.py
from __future__ import annotations

import logging
import requests
from django.conf import settings
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)
NASA_APOD_URL = "https://api.nasa.gov/planetary/apod"

def fetch_apod(date: str | None = None, timeout: int = 10) -> dict:
    """
    Fetch APOD from NASA for a specific date (YYYY-MM-DD) or today if date is None.
    Returns dict on success. Raises RuntimeError on failure.
    """
    params = {"api_key": settings.NASA_API_KEY}
    if date:
        params["date"] = date

    try:
        resp = requests.get(NASA_APOD_URL, params=params, timeout=timeout)
        # handle status codes explicitly
        if resp.status_code == 401 or resp.status_code == 403:
            logger.warning("Unauthorized: invalid NASA API key (status=%s)", resp.status_code)
            raise RuntimeError("API key invalid or unauthorized")
        if resp.status_code == 429:
            logger.warning("Rate limit reached (429)")
            raise RuntimeError("Rate limit exceeded")
        resp.raise_for_status()
        data = resp.json()
        if not isinstance(data, dict):
            raise RuntimeError("Unexpected response format")
        return data
    except (RequestException, Timeout) as exc:
        logger.exception("Request to NASA APOD failed: %s", exc)
        raise RuntimeError("Network error when contacting NASA APOD") from exc
