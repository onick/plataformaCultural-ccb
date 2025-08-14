"""
API module exports
"""

from .auth import router as auth_router
from .users import router as users_router
from .events import router as events_router
from .reservations import router as reservations_router
from .checkin import router as checkin_router
from .dashboard import router as dashboard_router
from .analytics import router as analytics_router
from .reports import router as reports_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "users_router", 
    "events_router",
    "reservations_router",
    "checkin_router",
    "dashboard_router",
    "analytics_router",
    "reports_router",
    "admin_router"
]
