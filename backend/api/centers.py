"""
Centers API endpoints for multi-center management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List

from models.centers import CenterCreate, CenterUpdate, Center, CenterStats
from models.common import SuccessResponse
from core.security import get_current_user, get_super_admin_user
from core.database import database

router = APIRouter()


@router.get("/centers", response_model=List[Center])
async def get_centers(current_user: dict = Depends(get_current_user)):
    """
    Get available centers based on user role
    """
    try:
        if current_user.get('role') == 'super_admin':
            # Super admin can see all centers
            centers_cursor = database.centers.find({"is_active": True})
        else:
            # Other users only see their center
            user_center = current_user.get('center', 'santo-domingo')
            centers_cursor = database.centers.find({
                "id": user_center,
                "is_active": True
            })
        
        centers = []
        for center in centers_cursor:
            # Remove MongoDB ObjectId
            if "_id" in center:
                del center["_id"]
            centers.append(center)
        
        return centers
        
    except Exception as e:
        print(f"Error in get_centers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve centers"
        )


@router.get("/centers/{center_id}", response_model=Center)
async def get_center(
    center_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get center by ID
    """
    try:
        # Check if user has access to this center
        if current_user.get('role') != 'super_admin':
            user_center = current_user.get('center', 'santo-domingo')
            if center_id != user_center:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this center"
                )
        
        center = database.centers.find_one({"id": center_id})
        if not center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Center not found"
            )
        
        # Remove MongoDB ObjectId
        if "_id" in center:
            del center["_id"]
        
        return center
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_center: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve center"
        )


@router.post("/centers", response_model=SuccessResponse)
async def create_center(
    center_data: CenterCreate,
    current_user: dict = Depends(get_super_admin_user)
):
    """
    Create a new center (Super admin only)
    """
    try:
        # Check if center already exists
        existing_center = database.centers.find_one({"id": center_data.id})
        if existing_center:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Center with this ID already exists"
            )
        
        # Create center document
        from datetime import datetime
        center_doc = center_data.dict()
        center_doc["created_at"] = datetime.utcnow().isoformat()
        center_doc["updated_at"] = datetime.utcnow().isoformat()
        
        result = database.centers.insert_one(center_doc)
        
        # Get the created center
        created_center = database.centers.find_one({"_id": result.inserted_id})
        if "_id" in created_center:
            del created_center["_id"]
        
        return SuccessResponse(
            message="Center created successfully",
            data=created_center
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in create_center: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create center"
        )


@router.put("/centers/{center_id}", response_model=SuccessResponse)
async def update_center(
    center_id: str,
    center_update: CenterUpdate,
    current_user: dict = Depends(get_super_admin_user)
):
    """
    Update center (Super admin only)
    """
    try:
        # Check if center exists
        existing_center = database.centers.find_one({"id": center_id})
        if not existing_center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Center not found"
            )
        
        # Prepare update data
        update_data = {}
        for field, value in center_update.dict(exclude_unset=True).items():
            if value is not None:
                update_data[field] = value
        
        if update_data:
            from datetime import datetime
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            database.centers.update_one(
                {"id": center_id},
                {"$set": update_data}
            )
        
        # Get updated center
        updated_center = database.centers.find_one({"id": center_id})
        if "_id" in updated_center:
            del updated_center["_id"]
        
        return SuccessResponse(
            message="Center updated successfully",
            data=updated_center
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in update_center: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update center"
        )


@router.get("/centers/{center_id}/stats", response_model=CenterStats)
async def get_center_stats(
    center_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get center statistics
    """
    try:
        # Check if user has access to this center
        if current_user.get('role') != 'super_admin':
            user_center = current_user.get('center', 'santo-domingo')
            if center_id != user_center:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied to this center's statistics"
                )
        
        # Check if center exists
        center = database.centers.find_one({"id": center_id})
        if not center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Center not found"
            )
        
        # Calculate statistics
        stats = {
            "center_id": center_id,
            "center_name": center["name"],
            "total_events": database.events.count_documents({"center": center_id}),
            "total_users": database.users.count_documents({"center": center_id}),
            "total_reservations": database.reservations.count_documents({"center": center_id}),
        }
        
        # This month statistics
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        stats.update({
            "events_this_month": database.events.count_documents({
                "center": center_id,
                "created_at": {"$gte": month_start.isoformat()}
            }),
            "reservations_this_month": database.reservations.count_documents({
                "center": center_id,
                "created_at": {"$gte": month_start.isoformat()}
            }),
            "checkins_this_month": database.reservations.count_documents({
                "center": center_id,
                "status": "checked_in",
                "created_at": {"$gte": month_start.isoformat()}
            }),
            "revenue_this_month": 0.0  # TODO: Calculate from paid events
        })
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_center_stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve center statistics"
        )


@router.delete("/centers/{center_id}", response_model=SuccessResponse)
async def deactivate_center(
    center_id: str,
    current_user: dict = Depends(get_super_admin_user)
):
    """
    Deactivate center (Super admin only)
    Note: We don't actually delete centers, just mark them as inactive
    """
    try:
        # Check if center exists
        existing_center = database.centers.find_one({"id": center_id})
        if not existing_center:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Center not found"
            )
        
        from datetime import datetime
        database.centers.update_one(
            {"id": center_id},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.utcnow().isoformat()
            }}
        )
        
        return SuccessResponse(
            message="Center deactivated successfully",
            data={"center_id": center_id, "status": "inactive"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in deactivate_center: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate center"
        )