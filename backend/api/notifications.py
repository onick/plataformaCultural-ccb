"""
Notifications API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

from models.common import SuccessResponse, ErrorResponse
from core.security import get_current_user, filter_by_center
from core.database import database
from core.config import settings

router = APIRouter()

# Pydantic models for notifications
class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "info"  # info, success, warning, error, event, reservation
    priority: str = "medium"  # low, medium, high, urgent
    user_id: Optional[str] = None
    center: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    expires_at: Optional[str] = None
    actions: Optional[List[Dict[str, Any]]] = None

class NotificationUpdate(BaseModel):
    read: Optional[bool] = None
    archived: Optional[bool] = None

class PushSubscription(BaseModel):
    endpoint: str
    keys: Dict[str, str]

class BulkReadRequest(BaseModel):
    ids: List[str]

class NotificationFilter(BaseModel):
    type: Optional[str] = None
    priority: Optional[str] = None
    read: Optional[bool] = None
    center: Optional[str] = None
    user_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


@router.get("/notifications", response_model=SuccessResponse)
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    type_filter: Optional[str] = Query(None, alias="type"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    read_filter: Optional[bool] = Query(None, alias="read"),
    current_user: dict = Depends(get_current_user)
):
    """Get user's notifications with pagination and filtering"""
    try:
        # Build query filter
        query_filter = {
            "user_id": current_user["id"],
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Apply optional filters
        if type_filter:
            query_filter["type"] = type_filter
        if priority_filter:
            query_filter["priority"] = priority_filter
        if read_filter is not None:
            query_filter["read"] = read_filter
            
        # Remove expired notifications
        now = datetime.utcnow().isoformat()
        query_filter["$or"] = [
            {"expires_at": {"$exists": False}},
            {"expires_at": None},
            {"expires_at": {"$gt": now}}
        ]
        
        # Get total count
        total_count = database.notifications.count_documents(query_filter)
        
        # Get notifications with pagination
        notifications = list(database.notifications.find(
            query_filter,
            {"_id": 0}
        ).sort("timestamp", -1).skip(skip).limit(limit))
        
        # Get unread count
        unread_count = database.notifications.count_documents({
            **query_filter,
            "read": False
        })
        
        return SuccessResponse(
            message="Notifications retrieved successfully",
            data={
                "notifications": notifications,
                "total": total_count,
                "unread_count": unread_count,
                "page": skip // limit + 1,
                "per_page": limit,
                "has_more": skip + limit < total_count
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )


@router.post("/notifications", response_model=SuccessResponse)
async def create_notification(
    notification_data: NotificationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification (Admin only)"""
    try:
        # Check admin permissions
        if current_user.get("role") not in ["super_admin", "admin_local"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        # Set default values
        notification = {
            "id": database.generate_id(),
            "title": notification_data.title,
            "message": notification_data.message,
            "type": notification_data.type,
            "priority": notification_data.priority,
            "user_id": notification_data.user_id or current_user["id"],
            "center": notification_data.center or current_user.get("center", "santo-domingo"),
            "metadata": notification_data.metadata or {},
            "expires_at": notification_data.expires_at,
            "actions": notification_data.actions or [],
            "read": False,
            "archived": False,
            "deleted": False,
            "timestamp": database.get_current_timestamp(),
            "created_by": current_user["id"]
        }
        
        # Insert notification
        result = database.notifications.insert_one(notification)
        
        if result.inserted_id:
            # Remove MongoDB ObjectId for response
            notification.pop("_id", None)
            
            return SuccessResponse(
                message="Notification created successfully",
                data=notification
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create notification"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create notification"
        )


@router.put("/notifications/{notification_id}", response_model=SuccessResponse)
async def update_notification(
    notification_id: str,
    notification_update: NotificationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update notification (mark as read/unread, archive)"""
    try:
        # Build query filter
        query_filter = {
            "id": notification_id,
            "user_id": current_user["id"],
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Build update data
        update_data = {"updated_at": database.get_current_timestamp()}
        
        if notification_update.read is not None:
            update_data["read"] = notification_update.read
        if notification_update.archived is not None:
            update_data["archived"] = notification_update.archived
            
        # Update notification
        result = database.notifications.update_one(
            query_filter,
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return SuccessResponse(
            message="Notification updated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update notification"
        )


@router.post("/notifications/mark-read", response_model=SuccessResponse)
async def mark_notifications_as_read(
    request: BulkReadRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark multiple notifications as read"""
    try:
        # Build query filter
        query_filter = {
            "id": {"$in": request.ids},
            "user_id": current_user["id"],
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Update notifications
        result = database.notifications.update_many(
            query_filter,
            {"$set": {
                "read": True,
                "updated_at": database.get_current_timestamp()
            }}
        )
        
        return SuccessResponse(
            message=f"Marked {result.modified_count} notifications as read"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notifications as read"
        )


@router.post("/notifications/mark-all-read", response_model=SuccessResponse)
async def mark_all_notifications_as_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all user notifications as read"""
    try:
        # Build query filter
        query_filter = {
            "user_id": current_user["id"],
            "read": False,
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Update notifications
        result = database.notifications.update_many(
            query_filter,
            {"$set": {
                "read": True,
                "updated_at": database.get_current_timestamp()
            }}
        )
        
        return SuccessResponse(
            message=f"Marked {result.modified_count} notifications as read"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read"
        )


@router.delete("/notifications/{notification_id}", response_model=SuccessResponse)
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification (soft delete)"""
    try:
        # Build query filter
        query_filter = {
            "id": notification_id,
            "user_id": current_user["id"],
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Soft delete notification
        result = database.notifications.update_one(
            query_filter,
            {"$set": {
                "deleted": True,
                "deleted_at": database.get_current_timestamp()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return SuccessResponse(
            message="Notification deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete notification"
        )


@router.post("/notifications/clear-all", response_model=SuccessResponse)
async def clear_all_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Clear all user notifications (soft delete)"""
    try:
        # Build query filter
        query_filter = {
            "user_id": current_user["id"],
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Soft delete all notifications
        result = database.notifications.update_many(
            query_filter,
            {"$set": {
                "deleted": True,
                "deleted_at": database.get_current_timestamp()
            }}
        )
        
        return SuccessResponse(
            message=f"Cleared {result.modified_count} notifications"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear notifications"
        )


@router.get("/notifications/unread-count", response_model=SuccessResponse)
async def get_unread_count(
    current_user: dict = Depends(get_current_user)
):
    """Get unread notifications count"""
    try:
        # Build query filter
        query_filter = {
            "user_id": current_user["id"],
            "read": False,
            "deleted": {"$ne": True}
        }
        
        # Apply center filter for non-super_admin users
        query_filter = filter_by_center(query_filter, current_user)
        
        # Remove expired notifications from count
        now = datetime.utcnow().isoformat()
        query_filter["$or"] = [
            {"expires_at": {"$exists": False}},
            {"expires_at": None},
            {"expires_at": {"$gt": now}}
        ]
        
        count = database.notifications.count_documents(query_filter)
        
        return SuccessResponse(
            message="Unread count retrieved successfully",
            data={"unread_count": count}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count"
        )


# Push notification endpoints
@router.post("/notifications/subscribe", response_model=SuccessResponse)
async def subscribe_to_push(
    subscription: PushSubscription,
    current_user: dict = Depends(get_current_user)
):
    """Subscribe user to push notifications"""
    try:
        subscription_data = {
            "id": database.generate_id(),
            "user_id": current_user["id"],
            "endpoint": subscription.endpoint,
            "keys": subscription.keys,
            "center": current_user.get("center", "santo-domingo"),
            "active": True,
            "created_at": database.get_current_timestamp(),
            "updated_at": database.get_current_timestamp()
        }
        
        # Upsert subscription (update if exists, insert if not)
        result = database.push_subscriptions.update_one(
            {
                "user_id": current_user["id"],
                "endpoint": subscription.endpoint
            },
            {"$set": subscription_data},
            upsert=True
        )
        
        return SuccessResponse(
            message="Successfully subscribed to push notifications"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe to push notifications"
        )


@router.post("/notifications/unsubscribe", response_model=SuccessResponse)
async def unsubscribe_from_push(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Unsubscribe user from push notifications"""
    try:
        endpoint = request.get("endpoint")
        if not endpoint:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Endpoint is required"
            )
        
        # Deactivate subscription
        result = database.push_subscriptions.update_one(
            {
                "user_id": current_user["id"],
                "endpoint": endpoint
            },
            {"$set": {
                "active": False,
                "updated_at": database.get_current_timestamp()
            }}
        )
        
        return SuccessResponse(
            message="Successfully unsubscribed from push notifications"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsubscribe from push notifications"
        )


@router.get("/notifications/cleanup", response_model=SuccessResponse)
async def cleanup_expired_notifications(
    current_user: dict = Depends(get_current_user)
):
    """Clean up expired notifications (Admin only)"""
    try:
        # Check admin permissions
        if current_user.get("role") not in ["super_admin", "admin_local"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        now = datetime.utcnow().isoformat()
        
        # Delete expired notifications
        result = database.notifications.delete_many({
            "expires_at": {"$lt": now, "$ne": None}
        })
        
        # Delete old deleted notifications (older than 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        old_deleted_result = database.notifications.delete_many({
            "deleted": True,
            "deleted_at": {"$lt": thirty_days_ago}
        })
        
        return SuccessResponse(
            message=f"Cleaned up {result.deleted_count} expired and {old_deleted_result.deleted_count} old deleted notifications"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup notifications"
        )