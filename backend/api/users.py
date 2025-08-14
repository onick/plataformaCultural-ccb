"""
Users API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from typing import Optional, List
import csv
import io

from models.users import User, UserUpdate, BulkUserAction, BulkImportResult
from models.common import SuccessResponse, PaginatedResponse
from core.security import get_current_user, get_admin_user
from core.database import database
from services.user_service import user_service
from utils.validation import validate_pagination, validate_search_query

router = APIRouter()


@router.get("/users", response_model=PaginatedResponse)
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    is_admin: Optional[bool] = Query(None),
    admin_user: dict = Depends(get_admin_user)
):
    """Get users with filtering and pagination (Admin only)"""
    try:
        # Validate pagination
        skip, limit = validate_pagination(skip, limit)
        search = validate_search_query(search)
        
        # Build query
        query = {"deleted": {"$ne": True}}
        
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}}
            ]
        
        if location:
            query["location"] = {"$regex": location, "$options": "i"}
        
        if is_admin is not None:
            query["is_admin"] = is_admin
        
        # Get total count
        total = database.users.count_documents(query)
        
        # Get users
        users_cursor = database.users.find(
            query,
            {"password": 0}  # Exclude password field
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        users = []
        for user in users_cursor:
            user.pop("_id", None)
            users.append(user)
        
        return PaginatedResponse(
            items=users,
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
            detail="Failed to retrieve users"
        )


@router.get("/users/{user_id}", response_model=SuccessResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get user by ID (own profile or admin access)"""
    try:
        # Check if user is accessing own profile or is admin
        if current_user["id"] != user_id and not current_user.get("is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this user"
            )
        
        user = await user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get additional stats for profile
        reservations_count = database.reservations.count_documents({
            "user_id": user_id,
            "status": {"$ne": "cancelled"}
        })
        
        checkins_count = database.checkins.count_documents({
            "user_id": user_id
        })
        
        user["total_reservations"] = reservations_count
        user["total_checkins"] = checkins_count
        
        return SuccessResponse(
            message="User retrieved successfully",
            data=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user"
        )


@router.put("/users/{user_id}", response_model=SuccessResponse)
async def update_user(
    user_id: str,
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user information"""
    try:
        # Check if user is updating own profile or is admin
        if current_user["id"] != user_id and not current_user.get("is_admin", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this user"
            )
        
        # Non-admin users cannot change admin status
        if not current_user.get("is_admin", False) and user_update.is_admin is not None:
            user_update.is_admin = None
        
        updated_user = await user_service.update_user(user_id, user_update)
        
        return SuccessResponse(
            message="User updated successfully",
            data=updated_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.delete("/users/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Delete user (Admin only) - Soft delete"""
    try:
        # Check if user exists
        user = await user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent self-deletion
        if admin_user["id"] == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        # Soft delete user
        result = database.users.update_one(
            {"id": user_id},
            {"$set": {"deleted": True, "deleted_at": database.get_current_timestamp()}}
        )
        
        if result.modified_count > 0:
            return SuccessResponse(
                message="User deleted successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete user"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )


@router.post("/users/bulk-action", response_model=SuccessResponse)
async def bulk_user_action(
    action_data: BulkUserAction,
    admin_user: dict = Depends(get_admin_user)
):
    """Perform bulk actions on users (Admin only)"""
    try:
        if not action_data.user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No user IDs provided"
            )
        
        # Prevent actions on self
        if admin_user["id"] in action_data.user_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot perform bulk actions on your own account"
            )
        
        update_doc = {}
        
        if action_data.action == "delete":
            update_doc = {
                "deleted": True,
                "deleted_at": database.get_current_timestamp()
            }
        elif action_data.action == "activate":
            update_doc = {"deleted": False}
        elif action_data.action == "make_admin":
            update_doc = {"is_admin": True}
        elif action_data.action == "remove_admin":
            update_doc = {"is_admin": False}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action"
            )
        
        # Perform bulk update
        result = database.users.update_many(
            {"id": {"$in": action_data.user_ids}},
            {"$set": update_doc}
        )
        
        return SuccessResponse(
            message=f"Bulk action completed successfully. {result.modified_count} users updated.",
            data={"modified_count": result.modified_count}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform bulk action"
        )


@router.post("/users/import", response_model=BulkImportResult)
async def import_users(
    file: UploadFile = File(...),
    admin_user: dict = Depends(get_admin_user)
):
    """Import users from CSV file (Admin only)"""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only CSV files are supported"
            )
        
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        results = {
            "total_processed": 0,
            "successful_imports": 0,
            "failed_imports": 0,
            "duplicate_emails": 0,
            "errors": [],
            "imported_users": []
        }
        
        for row_num, row in enumerate(csv_reader, start=2):
            results["total_processed"] += 1
            
            try:
                # Validate required fields
                required_fields = ["name", "email", "phone", "age", "location"]
                for field in required_fields:
                    if not row.get(field):
                        raise ValueError(f"Missing required field: {field}")
                
                # Check for duplicate email
                existing_user = database.users.find_one({"email": row["email"]})
                if existing_user:
                    results["duplicate_emails"] += 1
                    results["errors"].append({
                        "row": row_num,
                        "email": row["email"],
                        "error": "Email already exists"
                    })
                    continue
                
                # Create user (with default password)
                user_data = {
                    "name": row["name"],
                    "email": row["email"],
                    "password": "TempPass123!",  # Users will need to reset
                    "phone": row["phone"],
                    "age": int(row["age"]),
                    "location": row["location"]
                }
                
                # Create user using service (will validate and hash password)
                from models.users import UserCreate
                user_create = UserCreate(**user_data)
                new_user = await user_service.create_user(user_create)
                
                results["successful_imports"] += 1
                results["imported_users"].append({
                    "email": new_user["email"],
                    "name": new_user["name"]
                })
                
            except Exception as e:
                results["failed_imports"] += 1
                results["errors"].append({
                    "row": row_num,
                    "email": row.get("email", "unknown"),
                    "error": str(e)
                })
        
        return BulkImportResult(**results)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import users: {str(e)}"
        )


@router.get("/users/stats/overview")
async def get_user_stats(admin_user: dict = Depends(get_admin_user)):
    """Get user statistics overview (Admin only)"""
    try:
        # Total users
        total_users = database.users.count_documents({"deleted": {"$ne": True}})
        
        # Active users (logged in last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        active_users = database.users.count_documents({
            "deleted": {"$ne": True},
            "last_login": {"$gte": thirty_days_ago}
        })
        
        # New users this month
        this_month = datetime.utcnow().replace(day=1).isoformat()
        new_users_this_month = database.users.count_documents({
            "deleted": {"$ne": True},
            "created_at": {"$gte": this_month}
        })
        
        # Admin users
        admin_users = database.users.count_documents({
            "deleted": {"$ne": True},
            "is_admin": True
        })
        
        # Users by location (top 5)
        location_pipeline = [
            {"$match": {"deleted": {"$ne": True}}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        
        location_stats = list(database.users.aggregate(location_pipeline))
        
        return SuccessResponse(
            message="User statistics retrieved successfully",
            data={
                "total_users": total_users,
                "active_users": active_users,
                "new_users_this_month": new_users_this_month,
                "admin_users": admin_users,
                "users_by_location": location_stats
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user statistics"
        )
