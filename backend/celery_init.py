# celery_init.py
from celery import Celery
import os

# Configure Celery with Redis
broker_url = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
result_backend = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Create Celery app
app = Celery(
    'streamclout',
    broker=broker_url,
    backend=result_backend
)

# Basic configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True
)