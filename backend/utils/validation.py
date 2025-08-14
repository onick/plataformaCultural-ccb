"""
Validation utilities for data validation
"""

import re
from datetime import datetime
from typing import Optional
from fastapi import HTTPException, status
from email_validator import validate_email, EmailNotValidError

from models.users import UserCreate
from models.events import EventCreate


async def validate_user_data(user_data: UserCreate) -> None:
    """Validate user registration data"""
    
    # Validate email format
    try:
        validate_email(user_data.email)
    except EmailNotValidError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    # Validate name
    if len(user_data.name.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must be at least 2 characters long"
        )
    
    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Check password complexity
    if not re.search(r"[A-Z]", user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )
    
    if not re.search(r"[a-z]", user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )
    
    if not re.search(r"\d", user_data.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )
    
    # Validate phone (basic format)
    phone_pattern = r'^[\+]?[1-9][\d]{7,14}$'
    if not re.match(phone_pattern, user_data.phone.replace(" ", "").replace("-", "")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    
    # Validate age
    if user_data.age < 13 or user_data.age > 120:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Age must be between 13 and 120"
        )
    
    # Validate location
    if len(user_data.location.strip()) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location must be at least 2 characters long"
        )


async def validate_event_data(event_data: EventCreate) -> None:
    """Validate event creation data"""
    
    # Validate title
    if len(event_data.title.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event title must be at least 3 characters long"
        )
    
    # Validate description
    if len(event_data.description.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event description must be at least 10 characters long"
        )
    
    # Validate date format (YYYY-MM-DD)
    try:
        event_date = datetime.strptime(event_data.date, "%Y-%m-%d")
        if event_date.date() < datetime.now().date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event date cannot be in the past"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )
    
    # Validate time format (HH:MM)
    try:
        datetime.strptime(event_data.time, "%H:%M")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid time format. Use HH:MM (24-hour format)"
        )
    
    # Validate capacity
    if event_data.capacity < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event capacity must be at least 1"
        )
    
    if event_data.capacity > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event capacity cannot exceed 10,000"
        )
    
    # Validate location
    if len(event_data.location.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event location must be at least 3 characters long"
        )
    
    # Validate price if provided
    if event_data.price is not None and event_data.price < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event price cannot be negative"
        )
    
    # Validate image URL if provided
    if event_data.image_url:
        url_pattern = r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'
        if not re.match(url_pattern, event_data.image_url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid image URL format"
            )


def validate_reservation_code(code: str) -> bool:
    """Validate reservation code format"""
    # Reservation codes should be 8 characters, alphanumeric
    pattern = r'^[A-Z0-9]{8}$'
    return bool(re.match(pattern, code))


def validate_search_query(query: Optional[str]) -> Optional[str]:
    """Validate and sanitize search query"""
    if not query:
        return None
    
    # Remove extra whitespace and limit length
    sanitized = query.strip()
    
    if len(sanitized) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query must be at least 2 characters long"
        )
    
    if len(sanitized) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot exceed 100 characters"
        )
    
    # Basic sanitization - remove potentially harmful characters
    sanitized = re.sub(r'[<>"\'\\\;]', '', sanitized)
    
    return sanitized


def validate_pagination(skip: int = 0, limit: int = 20) -> tuple[int, int]:
    """Validate pagination parameters"""
    
    if skip < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skip parameter cannot be negative"
        )
    
    if limit < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit parameter must be at least 1"
        )
    
    if limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit parameter cannot exceed 100"
        )
    
    return skip, limit
