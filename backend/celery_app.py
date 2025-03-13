# celery_app.py
from celery_init import app
import os

# Import tasks module for registration
import tasks

# Additional configuration
app.conf.update(
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_default_rate_limit='300/m',
)

# Task routing
app.conf.task_routes = {
    'tasks.fetch_albums_batch': {'queue': 'albums'},
    'tasks.fetch_album_metrics': {'queue': 'metrics'},
    'tasks.upload_album_metrics': {'queue': 'upload'},
}

# Worker configuration
app.conf.worker_concurrency = os.cpu_count()

# Scheduled tasks
app.conf.beat_schedule = {
    'update-albums-daily': {
        'task': 'tasks.fetch_albums_batch',
        'schedule': 86400.0,  # Once per day
        'options': {'expires': 3600}
    },
}