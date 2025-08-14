"""
Check-in API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime

from models.reservations import CheckInRequest, CheckInResponse, CheckInStats
from models.common import SuccessResponse, PaginatedResponse
from core.security import get_current_user, get_admin_user
from core.database import database
from utils.qr_codes import decode_qr_data
from utils.validation import validate_reservation_code, validate_pagination

router = APIRouter()


@router.post("/checkin", response_model=CheckInResponse)
async def check_in_user(
    checkin_request: CheckInRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """Check in a user using various methods (Admin only)"""
    try:
        reservation = None
        
        if checkin_request.method == "qr_code":
            # Decode QR code data
            qr_decoded = decode_qr_data(checkin_request.value)
            
            if not qr_decoded or qr_decoded.get("type") != "reservation":
                return CheckInResponse(
                    success=False,
                    message="Invalid QR code format"
                )
            
            # Find reservation by ID
            reservation = database.reservations.find_one({
                "id": qr_decoded["reservation_id"]
            })
            
        elif checkin_request.method == "reservation_code":
            # Validate code format
            if not validate_reservation_code(checkin_request.value):
                return CheckInResponse(
                    success=False,
                    message="Invalid reservation code format"
                )
            
            # Find reservation by checkin code
            reservation = database.reservations.find_one({
                "checkin_code": checkin_request.value.upper()
            })
            
        elif checkin_request.method == "email":
            # Find user by email first
            user = database.users.find_one({
                "email": checkin_request.value.lower(),
                "deleted": {"$ne": True}
            })
            
            if not user:
                return CheckInResponse(
                    success=False,
                    message="User not found with this email"
                )
            
            # Find active reservations for this user
            query = {
                "user_id": user["id"],
                "status": "confirmed"
            }
            
            if checkin_request.event_id:
                query["event_id"] = checkin_request.event_id
            
            reservations = list(database.reservations.find(query))
            
            if len(reservations) == 0:
                return CheckInResponse(
                    success=False,
                    message="No active reservations found for this email"
                )
            elif len(reservations) > 1 and not checkin_request.event_id:
                return CheckInResponse(
                    success=False,
                    message="Multiple reservations found. Please specify event."
                )
            
            reservation = reservations[0]
            
        elif checkin_request.method == "name":
            # Find user by name (fuzzy match)
            users = list(database.users.find({
                "name": {"$regex": checkin_request.value, "$options": "i"},
                "deleted": {"$ne": True}
            }))
            
            if len(users) == 0:
                return CheckInResponse(
                    success=False,
                    message="User not found with this name"
                )
            elif len(users) > 1:
                return CheckInResponse(
                    success=False,
                    message=f"Multiple users found with name '{checkin_request.value}'"
                )
            
            user = users[0]
            
            # Find active reservations
            query = {
                "user_id": user["id"],
                "status": "confirmed"
            }
            
            if checkin_request.event_id:
                query["event_id"] = checkin_request.event_id
            
            reservations = list(database.reservations.find(query))
            
            if len(reservations) == 0:
                return CheckInResponse(
                    success=False,
                    message="No active reservations found for this user"
                )
            elif len(reservations) > 1 and not checkin_request.event_id:
                return CheckInResponse(
                    success=False,
                    message="Multiple reservations found. Please specify event."
                )
            
            reservation = reservations[0]
            
        else:
            return CheckInResponse(
                success=False,
                message="Invalid check-in method"
            )
        
        # Check if reservation found
        if not reservation:
            return CheckInResponse(
                success=False,
                message="Reservation not found"
            )
        
        # Check if already checked in
        if reservation["status"] == "checked_in":
            return CheckInResponse(
                success=False,
                message="User already checked in"
            )
        
        # Check if reservation is cancelled
        if reservation["status"] == "cancelled":
            return CheckInResponse(
                success=False,
                message="Reservation has been cancelled"
            )
        
        # Get reservation details with event and user info
        pipeline = [
            {"$match": {"id": reservation["id"]}},
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
                    "created_at": 1,
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
        
        reservation_details = list(database.reservations.aggregate(pipeline))
        
        if not reservation_details:
            return CheckInResponse(
                success=False,
                message="Reservation details not found"
            )
        
        # Update reservation status to checked_in
        checkin_time = datetime.utcnow().isoformat()
        result = database.reservations.update_one(
            {"id": reservation["id"]},
            {
                "$set": {
                    "status": "checked_in",
                    "checked_in_at": checkin_time,
                    "checked_in_by": admin_user["id"]
                }
            }
        )
        
        if result.modified_count > 0:
            # Record check-in event
            checkin_record = {
                "reservation_id": reservation["id"],
                "event_id": reservation["event_id"],
                "user_id": reservation["user_id"],
                "checked_in_by": admin_user["id"],
                "method": checkin_request.method,
                "timestamp": checkin_time
            }
            
            database.checkins.insert_one(checkin_record)
            
            return CheckInResponse(
                success=True,
                message="Check-in successful",
                reservation=reservation_details[0],
                timestamp=checkin_time
            )
        else:
            return CheckInResponse(
                success=False,
                message="Failed to update check-in status"
            )
            
    except Exception as e:
        return CheckInResponse(
            success=False,
            message=f"Check-in failed: {str(e)}"
        )


@router.get("/checkin/stats", response_model=CheckInStats)
async def get_checkin_stats(admin_user: dict = Depends(get_admin_user)):
    """Get check-in statistics (Admin only)"""
    try:
        # Total check-ins
        total_checkins = database.checkins.count_documents({})
        
        # Check-ins today
        today = datetime.utcnow().date().isoformat()
        checkins_today = database.checkins.count_documents({
            "timestamp": {"$regex": f"^{today}"}
        })
        
        # Calculate check-in rate
        total_reservations = database.reservations.count_documents({
            "status": {"$ne": "cancelled"}
        })
        
        checkin_rate = 0.0
        if total_reservations > 0:
            checked_in_reservations = database.reservations.count_documents({
                "status": "checked_in"
            })
            checkin_rate = (checked_in_reservations / total_reservations) * 100
        
        # Recent check-ins
        recent_checkins_pipeline = [
            {"$sort": {"timestamp": -1}},
            {"$limit": 10},
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
                    "user_name": "$user.name",
                    "event_title": "$event.title",
                    "method": 1,
                    "timestamp": 1
                }
            }
        ]
        
        recent_checkins = list(database.checkins.aggregate(recent_checkins_pipeline))
        
        # Popular check-in methods
        methods_pipeline = [
            {"$group": {"_id": "$method", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        methods_stats = {
            doc["_id"]: doc["count"] 
            for doc in database.checkins.aggregate(methods_pipeline)
        }
        
        return CheckInStats(
            total_checkins=total_checkins,
            checkins_today=checkins_today,
            checkin_rate=round(checkin_rate, 1),
            recent_checkins=recent_checkins,
            popular_checkin_methods=methods_stats
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve check-in statistics"
        )


@router.get("/checkin/history")
async def get_checkin_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    event_id: Optional[str] = Query(None),
    admin_user: dict = Depends(get_admin_user)
):
    """Get check-in history with pagination (Admin only)"""
    try:
        # Validate pagination
        skip, limit = validate_pagination(skip, limit)
        
        # Build query
        query = {}
        if event_id:
            query["event_id"] = event_id
        
        # Get check-ins with details
        pipeline = [
            {"$match": query},
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
                    "localField": "checked_in_by",
                    "foreignField": "id",
                    "as": "admin"
                }
            },
            {"$unwind": "$admin"},
            {
                "$project": {
                    "_id": 0,
                    "reservation_id": 1,
                    "user_name": "$user.name",
                    "user_email": "$user.email",
                    "event_title": "$event.title",
                    "event_date": "$event.date",
                    "event_time": "$event.time",
                    "method": 1,
                    "timestamp": 1,
                    "checked_in_by": "$admin.name"
                }
            },
            {"$sort": {"timestamp": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        checkins = list(database.checkins.aggregate(pipeline))
        
        # Get total count
        total = database.checkins.count_documents(query)
        
        return PaginatedResponse(
            items=checkins,
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
            detail="Failed to retrieve check-in history"
        )


@router.post("/checkin/search")
async def search_for_checkin(
    checkin_request: CheckInRequest,
    admin_user: dict = Depends(get_admin_user)
):
    """Search for reservations before check-in (Admin only)"""
    try:
        # This endpoint searches without actually checking in
        # Useful for verification before actual check-in
        
        reservations = []
        
        if checkin_request.method == "email":
            # Find user by email
            user = database.users.find_one({
                "email": checkin_request.value.lower(),
                "deleted": {"$ne": True}
            })
            
            if user:
                query = {
                    "user_id": user["id"],
                    "status": {"$in": ["confirmed", "checked_in"]}
                }
                
                if checkin_request.event_id:
                    query["event_id"] = checkin_request.event_id
                
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
                            "created_at": 1,
                            "event_title": "$event.title",
                            "event_date": "$event.date",
                            "event_time": "$event.time",
                            "user_name": user["name"],
                            "user_email": user["email"]
                        }
                    }
                ]
                
                reservations = list(database.reservations.aggregate(pipeline))
        
        elif checkin_request.method == "name":
            # Find users by name
            users = list(database.users.find({
                "name": {"$regex": checkin_request.value, "$options": "i"},
                "deleted": {"$ne": True}
            }).limit(5))  # Limit to 5 users
            
            for user in users:
                query = {
                    "user_id": user["id"],
                    "status": {"$in": ["confirmed", "checked_in"]}
                }
                
                if checkin_request.event_id:
                    query["event_id"] = checkin_request.event_id
                
                user_reservations = list(database.reservations.find(query))
                
                for reservation in user_reservations:
                    # Get event details
                    event = database.events.find_one({"id": reservation["event_id"]})
                    if event:
                        reservations.append({
                            "id": reservation["id"],
                            "status": reservation["status"],
                            "checkin_code": reservation["checkin_code"],
                            "created_at": reservation["created_at"],
                            "event_title": event["title"],
                            "event_date": event["date"],
                            "event_time": event["time"],
                            "user_name": user["name"],
                            "user_email": user["email"]
                        })
        
        return SuccessResponse(
            message=f"Found {len(reservations)} reservation(s)",
            data={"reservations": reservations}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )
