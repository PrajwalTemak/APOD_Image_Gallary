# apod/cache.py
from cachetools import TTLCache
from django.conf import settings
import threading

# single shared cache for APOD responses
_cache_lock = threading.Lock()
_cache = TTLCache(maxsize=settings.CACHE_MAX_ENTRIES, ttl=settings.CACHE_TTL_SECONDS)

def make_key(prefix: str, key: str) -> str:
    return f"{prefix}:{key}"

def get_cache(prefix: str, key: str):
    k = make_key(prefix, key)
    with _cache_lock:
        return _cache.get(k)

def set_cache(prefix: str, key: str, value):
    k = make_key(prefix, key)
    with _cache_lock:
        _cache[k] = value

def clear_cache():
    with _cache_lock:
        _cache.clear()
