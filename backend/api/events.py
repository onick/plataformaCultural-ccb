"""
Events API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from datetime import datetime

from models.events import EventCreate, EventUpdate, Event, EventStats
from models.common import SuccessResponse, PaginatedResponse
from core.security import get_current_user, get_admin_user, get_editor_user, filter_by_center
from core.database import database
from services.event_service import event_service
from utils.validation import validate_pagination, validate_search_query

router = APIRouter()


@router.get("/events")
async def get_events(
    center: Optional[str] = Query(None, description="Filter by center (super_admin only)"),
    current_user: dict = Depends(get_current_user)
):
    """Get events with center filtering"""
    try:
        # Build query filter with center-based filtering
        query_filter = {}
        
        # Apply center filtering based on user role
        if current_user.get('role') == 'super_admin':
            # Super admin can filter by specific center or see all
            if center:
                query_filter['center'] = center
        else:
            # Other users only see their center
            query_filter['center'] = current_user.get('center', 'santo-domingo')
        
        # Get events from database using center-filtered query
        events_cursor = database.db.events.find(query_filter)
        event_list = []
        
        for event in events_cursor:
            # Remove MongoDB ObjectId
            if "_id" in event:
                del event["_id"]
            
            # Ensure center field exists (backward compatibility)
            if 'center' not in event:
                event['center'] = 'santo-domingo'
            
            # Calculate available spots with center-filtered reservations
            try:
                reservation_filter = {
                    "event_id": event["id"],
                    "status": {"$ne": "cancelled"}
                }
                # Also filter reservations by center
                if 'center' in event:
                    reservation_filter['center'] = event['center']
                
                reservations_count = database.db.reservations.count_documents(reservation_filter)
                event["available_spots"] = max(0, event["capacity"] - reservations_count)
            except:
                # Fallback if reservation count fails
                event["available_spots"] = event["capacity"]
            
            event_list.append(event)
        
        return event_list
        
    except Exception as e:
        # Log the error but return empty list for now
        print(f"Error in get_events: {e}")
        return []
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve events"
        )


@router.get("/events/{event_id}", response_model=SuccessResponse)
async def get_event(
    event_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get event by ID with center filtering"""
    try:
        event = await event_service.get_event_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user has access to this event's center
        if current_user.get('role') != 'super_admin':
            event_center = event.get('center', 'santo-domingo')
            user_center = current_user.get('center', 'santo-domingo')
            if event_center != user_center:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this center's events"
                )
        
        return SuccessResponse(
            message="Event retrieved successfully",
            data=event
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event"
        )


@router.post("/events", response_model=SuccessResponse)
async def create_event(
    event_data: EventCreate,
    current_user: dict = Depends(get_editor_user)
):
    """Create a new event (Editor+ privileges required)"""
    try:
        # Auto-assign center based on user role
        if current_user.get('role') == 'super_admin':
            # Super admin can specify center or default to their center
            if not event_data.center:
                event_data.center = current_user.get('center', 'santo-domingo')
        else:
            # Local admins/editors can only create in their center
            event_data.center = current_user.get('center', 'santo-domingo')
        
        new_event = await event_service.create_event(event_data)
        
        return SuccessResponse(
            message="Event created successfully",
            data=new_event
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create event"
        )


@router.put("/events/{event_id}", response_model=SuccessResponse)
async def update_event(
    event_id: str,
    event_update: EventUpdate,
    current_user: dict = Depends(get_editor_user)
):
    """Update event (Editor+ privileges required)"""
    try:
        # First, get the event to check center access
        existing_event = await event_service.get_event_by_id(event_id)
        if not existing_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Check if user has access to this event's center
        if current_user.get('role') != 'super_admin':
            event_center = existing_event.get('center', 'santo-domingo')
            user_center = current_user.get('center', 'santo-domingo')
            if event_center != user_center:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot modify events from other centers"
                )
        
        # Prevent center changes for non-super_admin users
        if current_user.get('role') != 'super_admin' and event_update.center:
            if event_update.center != current_user.get('center'):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Cannot change event center"
                )
        
        updated_event = await event_service.update_event(event_id, event_update)
        
        return SuccessResponse(
            message="Event updated successfully",
            data=updated_event
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update event"
        )


@router.delete("/events/{event_id}", response_model=SuccessResponse)
async def delete_event(
    event_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Delete event (Admin only)"""
    try:
        deleted = await event_service.delete_event(event_id)
        
        if deleted:
            return SuccessResponse(
                message="Event deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete event"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event"
        )


@router.get("/events/categories/list")
async def get_event_categories():
    """Get list of available event categories"""
    return SuccessResponse(
        message="Event categories retrieved successfully",
        data={
            "categories": event_service.VALID_CATEGORIES
        }
    )


@router.get("/events/stats/overview")
async def get_event_stats(admin_user: dict = Depends(get_admin_user)):
    """Get event statistics overview (Admin only)"""
    try:
        # Total events
        total_events = database.events.count_documents({})
        
        # Published events
        published_events = database.events.count_documents({"published": True})
        
        # Draft events
        draft_events = database.events.count_documents({"published": False})
        
        # Events by category
        category_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        events_by_category = {
            doc["_id"]: doc["count"] 
            for doc in database.events.aggregate(category_pipeline)
        }
        
        # Events this month
        this_month = datetime.utcnow().replace(day=1).isoformat()
        events_this_month = database.events.count_documents({
            "created_at": {"$gte": this_month}
        })
        
        # Total reservations across all events
        total_reservations = database.reservations.count_documents({
            "status": {"$ne": "cancelled"}
        })
        
        # Calculate total revenue
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
        
        # Most popular events (by reservation count)
        popular_events_pipeline = [
            {
                "$match": {
                    "status": {"$ne": "cancelled"}
                }
            },
            {
                "$group": {
                    "_id": "$event_id",
                    "reservation_count": {"$sum": 1}
                }
            },
            {
                "$lookup": {
                    "from": "events",
                    "localField": "_id",
                    "foreignField": "id",
                    "as": "event"
                }
            },
            {"$unwind": "$event"},
            {
                "$project": {
                    "event_id": "$_id",
                    "event_title": "$event.title",
                    "event_category": "$event.category",
                    "reservation_count": 1
                }
            },
            {"$sort": {"reservation_count": -1}},
            {"$limit": 5}
        ]
        
        popular_events = list(database.reservations.aggregate(popular_events_pipeline))
        
        return SuccessResponse(
            message="Event statistics retrieved successfully",
            data={
                "total_events": total_events,
                "published_events": published_events,
                "draft_events": draft_events,
                "events_by_category": events_by_category,
                "events_this_month": events_this_month,
                "total_reservations": total_reservations,
                "total_revenue": total_revenue,
                "popular_events": popular_events
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve event statistics"
        )


@router.get("/events/{event_id}/reservations")
async def get_event_reservations(
    event_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    admin_user: dict = Depends(get_admin_user)
):
    """Get reservations for a specific event (Admin only)"""
    try:
        # Validate event exists
        event = await event_service.get_event_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Validate pagination
        skip, limit = validate_pagination(skip, limit)
        
        # Get reservations with user details
        pipeline = [
            {"$match": {"event_id": event_id}},
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
                    "user_name": "$user.name",
                    "user_email": "$user.email",
                    "user_phone": "$user.phone"
                }
            },
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit}
        ]
        
        reservations = list(database.reservations.aggregate(pipeline))
        
        # Get total count
        total = database.reservations.count_documents({"event_id": event_id})
        
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
            detail="Failed to retrieve event reservations"
        )


@router.post("/events/{event_id}/publish")
async def publish_event(
    event_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Publish/unpublish an event (Admin only)"""
    try:
        # Get current event
        event = await event_service.get_event_by_id(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Event not found"
            )
        
        # Toggle published status
        new_status = not event.get("published", True)
        
        # Update event
        from models.events import EventUpdate
        update_data = EventUpdate(published=new_status)
        updated_event = await event_service.update_event(event_id, update_data)
        
        action = "published" if new_status else "unpublished"
        
        return SuccessResponse(
            message=f"Event {action} successfully",
            data=updated_event
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update event publication status"
        )
