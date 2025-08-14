"""
Event service - Business logic for event operations
"""

import uuid
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from core.database import database
from models.events import EventCreate, EventUpdate, Event
from utils.validation import validate_event_data

logger = logging.getLogger(__name__)


class EventService:
    """Service for event-related operations"""
    
    VALID_CATEGORIES = [
        "Cinema Dominicano",
        "Cine Clásico", 
        "Cine General",
        "Talleres",
        "Conciertos",
        "Charlas/Conferencias",
        "Exposiciones de Arte",
        "Experiencias 3D"
    ]
    
    @staticmethod
    async def create_event(event_data: EventCreate) -> Dict[str, Any]:
        """Create a new event"""
        try:
            # Validate event data
            await validate_event_data(event_data)
            
            # Validate category
            if event_data.category not in EventService.VALID_CATEGORIES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid category. Must be one of: {EventService.VALID_CATEGORIES}"
                )
            
            # Create event document
            event_id = str(uuid.uuid4())
            event_doc = {
                "id": event_id,
                "title": event_data.title,
                "description": event_data.description,
                "category": event_data.category,
                "date": event_data.date,
                "time": event_data.time,
                "capacity": event_data.capacity,
                "location": event_data.location,
                "image_url": event_data.image_url,
                "price": event_data.price or 0.0,
                "tags": event_data.tags or [],
                "requirements": event_data.requirements,
                "contact_info": event_data.contact_info,
                "published": event_data.published,
                "available_spots": event_data.capacity,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": None
            }
            
            # Insert event
            result = database.events.insert_one(event_doc)
            
            if result.inserted_id:
                event_doc.pop("_id", None)
                logger.info(f"Event created: {event_data.title}")
                return event_doc
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create event"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating event: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    @staticmethod
    async def get_event_by_id(event_id: str) -> Optional[Dict[str, Any]]:
        """Get event by ID with reservation count"""
        try:
            event = database.events.find_one({"id": event_id})
            if event:
                # Calculate available spots
                # Calculate available spots
                reservation_count = database.reservations.count_documents({
                    "event_id": event_id,
                    "status": {"$ne": "cancelled"}
                })
                
                event["available_spots"] = max(0, event["capacity"] - reservation_count)
                event.pop("_id", None)
                
            return event
        except Exception as e:
            logger.error(f"Error getting event by ID: {e}")
            return None
    
    @staticmethod
    async def get_events(
        category: Optional[str] = None,
        published: Optional[bool] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get events with filtering and pagination"""
        try:
            # Build query
            query = {}
            
            if category:
                query["category"] = category
            
            if published is not None:
                query["published"] = published
            
            if search:
                query["$or"] = [
                    {"title": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"tags": {"$regex": search, "$options": "i"}}
                ]
            
            # Get total count
            total = database.events.count_documents(query)
            
            # Get events
            events_cursor = database.events.find(query).sort("date", 1).skip(skip).limit(limit)
            events = []
            
            for event in events_cursor:
                # Calculate available spots for each event
                reservation_count = database.reservations.count_documents({
                    "event_id": event["id"],
                    "status": {"$ne": "cancelled"}
                })
                
                event["available_spots"] = max(0, event["capacity"] - reservation_count)
                event.pop("_id", None)
                events.append(event)
            
            return {
                "events": events,
                "total": total,
                "page": (skip // limit) + 1,
                "page_size": limit,
                "total_pages": (total + limit - 1) // limit
            }
            
        except Exception as e:
            logger.error(f"Error getting events: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    @staticmethod
    async def update_event(event_id: str, update_data: EventUpdate) -> Dict[str, Any]:
        """Update event information"""
        try:
            # Check if event exists
            current_event = await EventService.get_event_by_id(event_id)
            if not current_event:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
            
            # Prepare update document
            update_doc = {}
            for field, value in update_data.dict(exclude_unset=True).items():
                if field == "category" and value not in EventService.VALID_CATEGORIES:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid category. Must be one of: {EventService.VALID_CATEGORIES}"
                    )
                update_doc[field] = value
            
            if update_doc:
                update_doc["updated_at"] = datetime.utcnow().isoformat()
                
                # Update event
                result = database.events.update_one(
                    {"id": event_id},
                    {"$set": update_doc}
                )
                
                if result.modified_count > 0:
                    updated_event = await EventService.get_event_by_id(event_id)
                    logger.info(f"Event updated: {event_id}")
                    return updated_event
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to update event"
                    )
            else:
                return current_event
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating event: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    @staticmethod
    async def delete_event(event_id: str) -> bool:
        """Delete an event"""
        try:
            # Check if event has reservations
            reservation_count = database.reservations.count_documents({
                "event_id": event_id,
                "status": {"$ne": "cancelled"}
            })
            
            if reservation_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot delete event with active reservations"
                )
            
            # Delete event
            result = database.events.delete_one({"id": event_id})
            
            if result.deleted_count > 0:
                logger.info(f"Event deleted: {event_id}")
                return True
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Event not found"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting event: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )


event_service = EventService()
