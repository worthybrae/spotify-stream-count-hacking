# Backend Celery Setup & Testing Guide

## 1. Activate your virtual environment
```sh
source ../venv/bin/activate
```

## 2. Start Redis (if not already running)
```sh
redis-server --daemonize yes
```

## 3. Start the Celery worker (from the backend directory)
**For default queue (for testing):**
```sh
celery -A celery_app worker --loglevel=info -E
```
**For production queues:**
```sh
celery -A celery_app worker -Q albums,metrics,upload --loglevel=info -E
```

## 4. Start Celery Beat (for scheduled tasks)
```sh
celery -A celery_app beat --loglevel=info
```

## 5. Start Flower (for monitoring)
```sh
celery -A celery_app flower --port=5555
```
Then visit [http://localhost:5555](http://localhost:5555) in your browser.

---

## 6. Test Celery with a Simple Task

In a new terminal, activate your venv and run Python:
```sh
cd backend
python3
```
Then in the Python shell:
```python
from tasks import ping
result = ping.delay("hello world")
print(result.get(timeout=10))
```
You should see `Ping received: hello world` in the worker logs and `Pong: hello world` in your Python shell.

---

## Troubleshooting
- **Tasks stuck in PENDING?**
  - Make sure the worker is running and listening to the correct queue.
  - For the `ping` test, do NOT use `-Q albums,metrics,upload`.
  - Make sure you are in the `backend` directory when starting the worker.
- **Import/module errors?**
  - Always start the worker from the `backend` directory.
- **No output in worker?**
  - Check that Redis is running.
  - Check for errors in the worker terminal.
- **Flower shows no tasks?**
  - Make sure you started the worker with `-E` to enable events.

---

## Stopping all Celery processes
To stop all Celery workers, beat, and Flower:
```sh
pkill -f celery
```

---

## Environment Variables
- Make sure your `.env` or environment variables are set for database and API keys as needed.

---

## Summary
1. Activate venv
2. Start Redis
3. Start worker (default queue for test, or with `-Q` for production)
4. Start beat (optional)
5. Start Flower (optional)
6. Test with `ping` task