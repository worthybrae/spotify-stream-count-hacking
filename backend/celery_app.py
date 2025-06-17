# celery_app.py
import os

# Import tasks module for registration
import tasks  # noqa: F401
from celery.schedules import crontab
from celery_init import app

# Additional configuration
app.conf.update(
    # Enable task events for Flower monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
    task_track_started=True,
    task_ignore_result=False,
    # Basic configuration
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_default_rate_limit="300/m",
    # Task time limits
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # 9 minutes soft limit
    # Queue configuration
    task_default_queue_max_priority=10,
    broker_transport_options={"visibility_timeout": 43200},  # 12 hours
    # Result backend configuration
    result_backend="redis://localhost:6379/0",
    result_expires=3600,  # Results expire after 1 hour
    # Broker configuration
    broker_url="redis://localhost:6379/0",
    # Enable task events
    event_queue_ttl=5.0,
    event_queue_expires=60.0,
)

# Task routing
app.conf.task_routes = {
    "tasks.fetch_albums_batch": {"queue": "albums"},
    "tasks.fetch_album_metrics": {"queue": "metrics"},
}

# Worker configuration
app.conf.worker_concurrency = os.cpu_count()

# Scheduled tasks
app.conf.beat_schedule = {
    "update-albums-daily": {
        "task": "tasks.fetch_albums_batch",
        "schedule": crontab(hour=14, minute=0),  # Runs at 5:32pm every day
        "options": {"expires": 21600},
    },
}
