# routes/monitor.py
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, Depends, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from services.monitor import monitor

from .dependencies import verify_api_key

# Set up templates
templates_directory = Path(__file__).parent.parent / "templates"
templates = Jinja2Templates(directory=str(templates_directory))

# Create templates directory if it doesn't exist
os.makedirs(str(templates_directory), exist_ok=True)

router = APIRouter(dependencies=[Depends(verify_api_key)])


@router.get("/health", summary="Get service health status")
async def get_health_status() -> Dict[str, Any]:
    """
    Get the health status of all services.

    Returns:
        Dictionary containing overall status and individual service statuses
    """
    # Run a check of all services
    await monitor.check_all_services()
    status = monitor.get_status_summary()

    return status


@router.post("/check", summary="Run a check of all services")
async def run_service_check(background_tasks: BackgroundTasks) -> Dict[str, Any]:
    """
    Manually trigger a check of all services.

    Returns:
        Dictionary containing service check status
    """
    # Run the check in the background to avoid blocking
    background_tasks.add_task(monitor.check_all_services)

    return {
        "status": "success",
        "message": "Service check started",
        "timestamp": datetime.now().isoformat(),
    }


@router.get(
    "/dashboard", response_class=HTMLResponse, summary="Service status dashboard"
)
async def status_dashboard(request: Request):
    """
    Render the service status dashboard page

    Returns:
        HTML page displaying service status
    """
    return templates.TemplateResponse("status.html", {"request": request})
