# apod/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path("today", views.apod_today, name="apod-today"),
    path("", views.apod_by_date, name="apod-by-date"),
    path("recent", views.apod_recent, name="apod-recent"),
    path("health", views.health, name="health"),
]
