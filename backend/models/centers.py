"""
Center-related Pydantic models for multi-center system
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr

# Multi-center system types
CenterID = Literal['santo-domingo', 'santiago']


class CenterCreate(BaseModel):
    """Model for center creation"""
    id: CenterID
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: bool = True


class CenterUpdate(BaseModel):
    """Model for center updates"""
    name: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = None


class Center(BaseModel):
    """Center response model"""
    id: CenterID
    name: str
    city: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool = True
    created_at: str
    updated_at: Optional[str] = None


class CenterStats(BaseModel):
    """Center statistics model"""
    center_id: CenterID
    center_name: str
    total_events: int
    total_users: int
    total_reservations: int
    events_this_month: int
    reservations_this_month: int
    checkins_this_month: int
    revenue_this_month: float