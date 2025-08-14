"""
Common response models and utilities
"""

from typing import Optional, List, Any, Dict
from pydantic import BaseModel


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    message: str
    data: Optional[Any] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: str
    detail: Optional[str] = None


class PaginatedResponse(BaseModel):
    """Paginated response model"""
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_previous: bool


class DashboardStats(BaseModel):
    """Dashboard statistics model"""
    total_users: int
    total_events: int
    total_reservations: int
    total_checkins: int
    users_today: int
    events_this_month: int
    reservations_today: int
    checkins_today: int
    revenue_today: float
    revenue_this_month: float
    checkin_rate: float
    popular_events: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]


class SystemStatus(BaseModel):
    """System status model"""
    status: str
    version: str
    database: Dict[str, Any]
    analytics: bool
    timestamp: str
    uptime: Optional[str] = None


class NotificationCreate(BaseModel):
    """Model for creating notifications"""
    title: str
    message: str
    type: str  # "info", "warning", "error", "success"
    user_id: Optional[str] = None  # If None, send to all admins
    priority: Optional[str] = "normal"  # "low", "normal", "high"


class Notification(BaseModel):
    """Notification model"""
    id: str
    title: str
    message: str
    type: str
    user_id: Optional[str] = None
    priority: str = "normal"
    read: bool = False
    created_at: str


class FileUpload(BaseModel):
    """File upload response model"""
    filename: str
    url: str
    size: int
    content_type: str
    uploaded_at: str


class QRCodeResponse(BaseModel):
    """QR Code generation response"""
    qr_code: str  # Base64 encoded image
    code: str     # The actual code value
    url: Optional[str] = None


class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: str
    services: Dict[str, Any]
