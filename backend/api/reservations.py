"""
Reservations API endpoints
"""

import uuid
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from datetime import datetime

from models.reservations import ReservationCreate, Reservation, ReservationWithDetails
from models.common import SuccessResponse, PaginatedResponse
from core.security import get_current_user, get_admin_user
from core.database import database
from services.event_service import event_service
from services.user_service import user_service
from utils.qr_codes import generate_reservation_code, generate_reservation_qr_code
from utils.email import send_reservation_confirmation_email
from utils.validation import validate_pagination

router = APIRouter()


@router.post("/reservations", response_model=SuccessResponse)
async def create_reservation(
    reservation_data: ReservationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new reservation"""
    try:
        # Validate event exists and has capacity
        event = await event_service.get_event_by_id(reservation_data.event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        if not event.get("published", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is not published"
            )
        
        # Check if event is in the past
        event_date = datetime.strptime(event["date"], "%Y-%m-%d").date()
        if event_date < datetime.utcnow().date():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reserve for past events"
            )
        
        # Check if user already has a reservation for this event
        existing_reservation = database.reservations.find_one({
            "event_id": reservation_data.event_id,
            "user_id": current_user["id"],
            "status": {"$ne": "cancelled"}
        })
        
        if existing_reservation:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a reservation for this event"
            )
        
        # Check available capacity
        if event["available_spots"] <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is fully booked"
            )
        
        # Create reservation
        reservation_id = str(uuid.uuid4())
        checkin_code = generate_reservation_code()
        qr_code = generate_reservation_qr_code(reservation_id, checkin_code)
        
        reservation_doc = {
            "id": reservation_id,
            "event_id": reservation_data.event_id,
            "user_id": current_user["id"],
            "status": "confirmed",
            "qr_code": qr_code,
            "checkin_code": checkin_code,
            "created_at": datetime.utcnow().isoformat(),
            "notes": reservation_data.notes
        }
        
        # Insert reservation
        result = database.reservations.insert_one(reservation_doc)
        
        if result.inserted_id:
            # Send confirmation email
            try:
                await send_reservation_confirmation_email(
                    current_user["email"],
                    current_user["name"],
                    event["title"],
                    event["date"],
                    event["time"],
                    checkin_code,
                    qr_code
                )
            except Exception as e:
                # Don't fail reservation if email fails
                pass
            
            reservation_doc.pop("_id", None)
            
            return SuccessResponse(
                message="Reservation created successfully",
                data=reservation_doc
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create reservation"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create reservation"
        )


@router.get("/reservations", response_model=PaginatedResponse)
async def get_user_reservations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's reservations"""
    try:
        # Validate pagination
        skip, limit = validate_pagination(skip, limit)
        
        # Build query
        query = {"user_id": current_user["id"]}
        if status_filter:
            query["status"] = status_filter
        
        # Get reservations with event details
        pipeline = [
            {"$match": query},
            {
                "$lookup": {
                    "from": "events",
                    "localField": "event_id",
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$project": {
                    "_id": 0,
                    "id": 1,
                    "status": 1,
                    "checkin_code": 1,
                    "qr_code": 1,
                    "created_at": 1,
                    "notes": 1,
                    "event_id": "$event.id",
                    "event_title": "$event.title",
                    "event_date": "$event.date",
                    "event_time": "$event.time",
                    "event_location": "$event.location",
                    "event_category": "$event.category"
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        reservations = list(database.reservations.aggregate(pipeline))
        
        # Get total count
        total = database.reservations.count_documents(query)
        
        return PaginatedResponse(
            items=reservations,
            total=total,
            page=(skip // limit) + 1,
            page_size=limit,
            total_pages=(total + limit - 1) // limit,
            has_next=skip + limit < total,
            has_previous=skip > 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reservations"
        )


@router.get("/reservations/{reservation_id}", response_model=SuccessResponse)
async def get_reservation(
    reservation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get reservation by ID"""
    try:
        # Get reservation with event and user details
        pipeline = [
            {"$match": {"id": reservation_id}},
            {
                "$lookup": {
                    "from": "events",
                    "localField": "event_id",
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "user_id",
                    "foreignField": "id",
                    "as": "user"
                }
            },
            {"$unwind": "$user"},
            {
                "$project": {
                    "_id": 0,
                    "id": 1,
                    "status": 1,
                    "checkin_code": 1,
                    "qr_code": 1,
                    "created_at": 1,
                    "notes": 1,
                    "event_id": "$event.id",
                    "event_title": "$event.title",
                    "event_date": "$event.date",
                    "event_time": "$event.time",
                    "event_location": "$event.location",
                    "user_id": "$user.id",
                    "user_name": "$user.name",
                    "user_email": "$user.email"
                }
            }
        ]
        
        reservations = list(database.reservations.aggregate(pipeline))
        
        if not reservations:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found"
            )
        
        reservation = reservations[0]
        
        # Check access permission
        if (reservation["user_id"] != current_user["id"] and 
            not current_user.get("is_admin", False)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this reservation"
            )
        
        return SuccessResponse(
            message="Reservation retrieved successfully",
            data=reservation
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reservation"
        )


@router.put("/reservations/{reservation_id}/cancel", response_model=SuccessResponse)
async def cancel_reservation(
    reservation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Cancel a reservation"""
    try:
        # Get reservation
        reservation = database.reservations.find_one({"id": reservation_id})
        
        if not reservation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Reservation not found"
            )
        
        # Check access permission
        if (reservation["user_id"] != current_user["id"] and 
            not current_user.get("is_admin", False)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to cancel this reservation"
            )
        
        # Check if already cancelled
        if reservation["status"] == "cancelled":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reservation is already cancelled"
            )
        
        # Check if event has already happened
        event = await event_service.get_event_by_id(reservation["event_id"])
        if event:
            event_date = datetime.strptime(event["date"], "%Y-%m-%d").date()
            if event_date < datetime.utcnow().date():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot cancel reservation for past events"
                )
        
        # Cancel reservation
        result = database.reservations.update_one(
            {"id": reservation_id},
            {
                "$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow().isoformat()
                }
            }
        )
        
        if result.modified_count > 0:
            return SuccessResponse(
                message="Reservation cancelled successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to cancel reservation"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel reservation"
        )


@router.get("/reservations/stats/overview")
async def get_reservation_stats(admin_user: dict = Depends(get_admin_user)):
    """Get reservation statistics overview (Admin only)"""
    try:
        # Total reservations
        total_reservations = database.reservations.count_documents({})
        
        # Confirmed reservations
        confirmed_reservations = database.reservations.count_documents({
            "status": "confirmed"
        })
        
        # Checked-in reservations
        checked_in_reservations = database.reservations.count_documents({
            "status": "checked_in"
        })
        
        # Cancelled reservations
        cancelled_reservations = database.reservations.count_documents({
            "status": "cancelled"
        })
        
        # Reservations today
        today = datetime.utcnow().date().isoformat()
        reservations_today = database.reservations.count_documents({
            "created_at": {"$regex": f"^{today}"}
        })
        
        # Calculate revenue
        revenue_pipeline = [
            {
                "$lookup": {
                    "from": "events",
                    "localField": "event_id", 
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$match": {
                    "status": {"$ne": "cancelled"}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_revenue": {"$sum": {"$ifNull": ["$event.price", 0]}}
                }
            }
        ]
        
        revenue_result = list(database.reservations.aggregate(revenue_pipeline))
        total_revenue = revenue_result[0]["total_revenue"] if revenue_result else 0
        
        return SuccessResponse(
            message="Reservation statistics retrieved successfully",
            data={
                "total_reservations": total_reservations,
                "confirmed_reservations": confirmed_reservations,
                "checked_in_reservations": checked_in_reservations,
                "cancelled_reservations": cancelled_reservations,
                "reservations_today": reservations_today,
                "total_revenue": total_revenue
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reservation statistics"
        )
