"""
Reservation and Check-in related Pydantic models
"""

from typing import Optional, List, Literal
from pydantic import BaseModel

# Multi-center system types
CenterID = Literal['santo-domingo', 'santiago']


class ReservationCreate(BaseModel):
    """Model for reservation creation"""
    event_id: str
    notes: Optional[str] = None


class Reservation(BaseModel):
    """Reservation response model"""
    id: str
    event_id: str
    user_id: str
    status: str  # confirmed, checked_in, cancelled
    center: CenterID
    qr_code: Optional[str] = None
    checkin_code: str  # 8-character unique code for check-in
    created_at: str
    updated_at: Optional[str] = None
    notes: Optional[str] = None


class ReservationWithDetails(BaseModel):
    """Reservation with event and user details"""
    id: str
    event_id: str
    event_title: str
    event_date: str
    event_time: str
    event_location: str
    center: CenterID
    user_id: str
    user_name: str
    user_email: str
    status: str
    checkin_code: str
    qr_code: Optional[str] = None
    created_at: str
    notes: Optional[str] = None


class CheckInRequest(BaseModel):
    """Model for check-in requests"""
    method: str  # "qr_code", "reservation_code", "email", "name"
    value: str  # The actual value to search for
    event_id: Optional[str] = None  # Optional event filter


class CheckInResponse(BaseModel):
    """Model for check-in responses"""
    success: bool
    message: str
    reservation: Optional[ReservationWithDetails] = None
    timestamp: Optional[str] = None


class CheckInStats(BaseModel):
    """Check-in statistics model"""
    total_checkins: int
    checkins_today: int
    checkin_rate: float  # percentage
    recent_checkins: List[dict]
    popular_checkin_methods: dict
    center: Optional[CenterID] = None  # For center-specific stats


class BulkCheckIn(BaseModel):
    """Model for bulk check-in operations"""
    reservation_codes: List[str]
    event_id: Optional[str] = None


class ReservationStats(BaseModel):
    """Reservation statistics model"""
    total_reservations: int
    confirmed_reservations: int
    checked_in_reservations: int
    cancelled_reservations: int
    reservations_today: int
    reservations_this_week: int
    reservations_this_month: int
    revenue_today: float
    revenue_this_week: float
    revenue_this_month: float
    center: Optional[CenterID] = None  # For center-specific stats
