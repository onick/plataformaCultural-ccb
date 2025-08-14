"""
Core module exports
"""

from .config import settings
from .database import database
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    verify_token,
    get_current_user,
    get_admin_user,
    generate_password_reset_token,
    verify_password_reset_token
)
from .analytics_init import (
    initialize_analytics,
    cleanup_analytics,
    get_analytics_tracker,
    get_performance_tracker,
    get_dashboard_manager,
    get_user_segmentation
)

__all__ = [
    "settings",
    "database",
    "hash_password",
    "verify_password", 
    "create_access_token",
    "verify_token",
    "get_current_user",
    "get_admin_user",
    "generate_password_reset_token",
    "verify_password_reset_token",
    "initialize_analytics",
    "cleanup_analytics",
    "get_analytics_tracker",
    "get_performance_tracker",
    "get_dashboard_manager",
    "get_user_segmentation"
]
