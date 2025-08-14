"""
User Interests API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List

from models.common import SuccessResponse
from core.security import get_current_user
from services.interest_detection_service import interest_detection_service

router = APIRouter()


@router.get("/interests/my-interests", response_model=SuccessResponse)
async def get_my_interests(
    current_user: dict = Depends(get_current_user)
):
    """Get current user's interest analysis"""
    try:
        interests_data = interest_detection_service.analyze_user_interests(current_user["id"])
        
        return SuccessResponse(
            message="User interests retrieved successfully",
            data=interests_data
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user interests"
        )


@router.get("/interests/recommendations", response_model=SuccessResponse)
async def get_personalized_recommendations(
    limit: int = Query(3, ge=1, le=10),
    current_user: dict = Depends(get_current_user)
):
    """Get personalized event recommendations based on user interests"""
    try:
        interests_data = interest_detection_service.analyze_user_interests(current_user["id"])
        recommendations = interests_data.get("recommendations", [])
        
        # Limit results
        recommendations = recommendations[:limit]
        
        return SuccessResponse(
            message="Personalized recommendations retrieved successfully",
            data={
                "recommendations": recommendations,
                "based_on_interests": interests_data.get("primary_interests", []),
                "engagement_level": interests_data.get("engagement_level", "new")
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommendations"
        )


@router.get("/interests/similar-users", response_model=SuccessResponse)
async def get_similar_users(
    limit: int = Query(5, ge=1, le=10),
    current_user: dict = Depends(get_current_user)
):
    """Find users with similar interests"""
    try:
        similar_users = interest_detection_service.get_similar_users(
            current_user["id"], 
            limit=limit
        )
        
        return SuccessResponse(
            message="Similar users retrieved successfully",
            data={
                "similar_users": similar_users,
                "total_found": len(similar_users)
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find similar users"
        )


@router.post("/interests/update-profile", response_model=SuccessResponse)
async def update_user_interests_profile(
    current_user: dict = Depends(get_current_user)
):
    """Update user profile with latest interest analysis"""
    try:
        success = interest_detection_service.update_user_profile_with_interests(
            current_user["id"]
        )
        
        if success:
            return SuccessResponse(
                message="User interests profile updated successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update user interests profile"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user interests profile"
        )


@router.get("/interests/stats", response_model=SuccessResponse)
async def get_interest_statistics(
    current_user: dict = Depends(get_current_user)
):
    """Get user's activity and interest statistics"""
    try:
        interests_data = interest_detection_service.analyze_user_interests(current_user["id"])
        
        stats = {
            "engagement_level": interests_data.get("engagement_level", "new"),
            "diversity_score": interests_data.get("diversity_score", 0.0),
            "activity_summary": interests_data.get("activity_summary", {}),
            "total_categories": len(interests_data.get("interest_percentages", {})),
            "top_category": None,
            "analysis_date": interests_data.get("analysis_date")
        }
        
        # Find top category
        primary_interests = interests_data.get("primary_interests", [])
        if primary_interests:
            stats["top_category"] = {
                "category": primary_interests[0]["category"],
                "percentage": primary_interests[0]["percentage"]
            }
        
        return SuccessResponse(
            message="Interest statistics retrieved successfully",
            data=stats
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve interest statistics"
        )


# Admin endpoints
@router.get("/interests/user/{user_id}", response_model=SuccessResponse)
async def get_user_interests_admin(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get any user's interests (Admin only)"""
    try:
        # Check admin permissions
        if current_user.get("role") not in ["super_admin", "admin_local"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        interests_data = interest_detection_service.analyze_user_interests(user_id)
        
        return SuccessResponse(
            message="User interests retrieved successfully",
            data=interests_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user interests"
        )


@router.get("/interests/analytics/categories", response_model=SuccessResponse)
async def get_category_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get analytics on category preferences across users (Admin only)"""
    try:
        # Check admin permissions
        if current_user.get("role") not in ["super_admin", "admin_local"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin privileges required"
            )
        
        from core.database import database
        from collections import Counter
        
        # Get all users with interests
        users_with_interests = database.users.find(
            {"interests": {"$exists": True}, "deleted": {"$ne": True}},
            {"interests": 1, "center": 1}
        )
        
        category_stats = Counter()
        engagement_levels = Counter()
        center_preferences = {}
        
        for user in users_with_interests:
            interests = user.get("interests", {})
            user_center = user.get("center", "santo-domingo")
            
            # Count primary interests
            primary_interests = interests.get("primary_interests", [])
            for interest in primary_interests:
                category = interest.get("category", "Unknown")
                category_stats[category] += 1
                
                # Track by center
                if user_center not in center_preferences:
                    center_preferences[user_center] = Counter()
                center_preferences[user_center][category] += 1
            
            # Count engagement levels
            engagement = interests.get("engagement_level", "new")
            engagement_levels[engagement] += 1
        
        return SuccessResponse(
            message="Category analytics retrieved successfully",
            data={
                "category_popularity": dict(category_stats.most_common()),
                "engagement_distribution": dict(engagement_levels),
                "center_preferences": {
                    center: dict(prefs.most_common()) 
                    for center, prefs in center_preferences.items()
                },
                "total_analyzed_users": sum(engagement_levels.values())
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve category analytics"
        )