# celery_app.py
import os

# Import tasks module for registration
import tasks  # noqa: F401
from celery.schedules import crontab
from celery_init import app

# Additional configuration
app.conf.update(
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_default_rate_limit="300/m",
    # Add these for better reliability with recursive tasks
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # 9 minutes soft limit (for graceful timeout)
    # Prevent thundering herd problem (many tasks at once)
    task_default_queue_max_priority=10,
    # Prevent overloading the broker with too many pending tasks
    broker_transport_options={"visibility_timeout": 43200},  # 12 hours
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
