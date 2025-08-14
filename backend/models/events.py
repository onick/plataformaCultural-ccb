"""
Event-related Pydantic models
"""

from typing import Optional, List, Literal
from pydantic import BaseModel

# Multi-center system types
CenterID = Literal['santo-domingo', 'santiago']


class EventCreate(BaseModel):
    """Model for event creation"""
    title: str
    description: str
    category: str
    date: str
    time: str
    capacity: int
    location: str
    center: CenterID = 'santo-domingo'
    image_url: Optional[str] = None
    price: Optional[float] = 0.0
    tags: Optional[List[str]] = []
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    published: Optional[bool] = True


class EventUpdate(BaseModel):
    """Model for event updates"""
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    capacity: Optional[int] = None
    location: Optional[str] = None
    center: Optional[CenterID] = None
    image_url: Optional[str] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = None
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    published: Optional[bool] = None


class Event(BaseModel):
    """Event response model"""
    id: str
    title: str
    description: str
    category: str
    date: str
    time: str
    capacity: int
    location: str
    center: CenterID
    image_url: Optional[str] = None
    price: Optional[float] = 0.0
    tags: Optional[List[str]] = []
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    published: bool = True
    available_spots: int
    created_at: str
    updated_at: Optional[str] = None


class EventSummary(BaseModel):
    """Simplified event model for listings"""
    id: str
    title: str
    category: str
    date: str
    time: str
    location: str
    center: CenterID
    available_spots: int
    price: Optional[float] = 0.0
    image_url: Optional[str] = None


class EventStats(BaseModel):
    """Event statistics model"""
    total_events: int
    published_events: int
    draft_events: int
    events_by_category: dict
    events_this_month: int
    total_reservations: int
    total_revenue: float
    center: Optional[CenterID] = None  # For center-specific stats
