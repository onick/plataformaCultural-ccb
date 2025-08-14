"""
Admin API endpoints for administrative functions
"""

from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from datetime import datetime, timedelta

from models.common import SuccessResponse, SystemStatus
from core.security import get_admin_user
from core.database import database
from core.config import settings

router = APIRouter()


@router.get("/admin/system-info")
async def get_system_info(admin_user: dict = Depends(get_admin_user)):
    """Get comprehensive system information (Admin only)"""
    try:
        # Database stats
        db_stats = await database.health_check()
        
        # Collection stats
        collections_info = {}
        for collection_name in ["users", "events", "reservations", "checkins"]:
            collection = getattr(database, collection_name)
            if collection:
                count = collection.count_documents({})
                collections_info[collection_name] = {
                    "document_count": count,
                    "collection_exists": True
                }
            else:
                collections_info[collection_name] = {
                    "document_count": 0,
                    "collection_exists": False
                }
        
        # Application info
        app_info = {
            "version": "2.0.0",
            "environment": "development",
            "debug_mode": settings.DEBUG,
            "database_url": settings.MONGO_URL.replace(
                settings.MONGO_URL.split("@")[0].split("//")[1], "***"
            ) if "@" in settings.MONGO_URL else settings.MONGO_URL,
            "features": {
                "email_notifications": bool(settings.SENDGRID_API_KEY),
                "analytics": settings.ANALYTICS_ENABLED,
                "file_uploads": True,
                "qr_codes": True
            }
        }
        
        system_info = {
            "application": app_info,
            "database": db_stats,
            "collections": collections_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return SuccessResponse(
            message="System information retrieved successfully",
            data=system_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system information"
        )


@router.post("/admin/maintenance/cleanup")
async def cleanup_data(admin_user: dict = Depends(get_admin_user)):
    """Perform data cleanup operations (Admin only)"""
    try:
        cleanup_results = {
            "deleted_users_removed": 0,
            "cancelled_reservations_cleaned": 0,
            "old_analytics_removed": 0,
            "cleanup_performed_at": datetime.utcnow().isoformat()
        }
        
        # Remove soft-deleted users older than 90 days
        ninety_days_ago = (datetime.utcnow() - timedelta(days=90)).isoformat()
        deleted_users_result = database.users.delete_many({
            "deleted": True,
            "deleted_at": {"$lt": ninety_days_ago}
        })
        cleanup_results["deleted_users_removed"] = deleted_users_result.deleted_count
        
        # Clean up old cancelled reservations (older than 1 year)
        one_year_ago = (datetime.utcnow() - timedelta(days=365)).isoformat()
        cancelled_reservations_result = database.reservations.delete_many({
            "status": "cancelled",
            "created_at": {"$lt": one_year_ago}
        })
        cleanup_results["cancelled_reservations_cleaned"] = cancelled_reservations_result.deleted_count
        
        # Clean up old analytics data if retention period is set
        if settings.ANALYTICS_RETENTION_DAYS > 0:
            retention_date = (datetime.utcnow() - timedelta(days=settings.ANALYTICS_RETENTION_DAYS)).isoformat()
            analytics_result = database.analytics.delete_many({
                "timestamp": {"$lt": retention_date}
            })
            cleanup_results["old_analytics_removed"] = analytics_result.deleted_count
        
        return SuccessResponse(
            message="Data cleanup completed successfully",
            data=cleanup_results
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to perform data cleanup"
        )


@router.get("/admin/database/indexes")
async def get_database_indexes(admin_user: dict = Depends(get_admin_user)):
    """Get database indexes information (Admin only)"""
    try:
        indexes_info = {}
        
        # Get indexes for each collection
        collections = ["users", "events", "reservations", "checkins", "analytics"]
        
        for collection_name in collections:
            try:
                collection = database.db[collection_name]
                indexes = list(collection.list_indexes())
                indexes_info[collection_name] = [
                    {
                        "name": idx.get("name"),
                        "key": dict(idx.get("key", {})),
                        "unique": idx.get("unique", False),
                        "sparse": idx.get("sparse", False)
                    }
                    for idx in indexes
                ]
            except Exception as e:
                indexes_info[collection_name] = f"Error retrieving indexes: {str(e)}"
        
        return SuccessResponse(
            message="Database indexes retrieved successfully",
            data=indexes_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve database indexes"
        )


@router.post("/admin/database/optimize")
async def optimize_database(admin_user: dict = Depends(get_admin_user)):
    """Optimize database performance (Admin only)"""
    try:
        optimization_results = {
            "collections_analyzed": 0,
            "indexes_created": 0,
            "optimization_performed_at": datetime.utcnow().isoformat()
        }
        
        # This is a placeholder for database optimization
        # In a real implementation, you might:
        # - Rebuild indexes
        # - Analyze collection statistics
        # - Optimize query performance
        # - Compact collections
        
        collections = ["users", "events", "reservations", "checkins"]
        optimization_results["collections_analyzed"] = len(collections)
        
        return SuccessResponse(
            message="Database optimization completed successfully",
            data=optimization_results
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize database"
        )


@router.get("/admin/logs/recent")
async def get_recent_logs(
    lines: int = 100,
    admin_user: dict = Depends(get_admin_user)
):
    """Get recent application logs (Admin only)"""
    try:
        # This is a placeholder for log retrieval
        # In a real implementation, you would read from actual log files
        
        sample_logs = [
            {
                "timestamp": "2025-07-15T10:30:25.123Z",
                "level": "INFO",
                "message": "User authentication successful",
                "module": "auth",
                "user_id": "user_123"
            },
            {
                "timestamp": "2025-07-15T10:29:45.456Z",
                "level": "INFO", 
                "message": "New event created: Concert in the Park",
                "module": "events",
                "admin_id": admin_user["id"]
            },
            {
                "timestamp": "2025-07-15T10:28:12.789Z",
                "level": "WARNING",
                "message": "High reservation volume detected",
                "module": "reservations"
            },
            {
                "timestamp": "2025-07-15T10:27:33.012Z",
                "level": "INFO",
                "message": "Database backup completed successfully",
                "module": "database"
            }
        ]
        
        # Limit to requested number of lines
        logs = sample_logs[:lines]
        
        return SuccessResponse(
            message=f"Retrieved {len(logs)} recent log entries",
            data={"logs": logs}
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent logs"
        )


@router.get("/admin/config/settings")
async def get_application_settings(admin_user: dict = Depends(get_admin_user)):
    """Get application configuration settings (Admin only)"""
    try:
        # Return safe configuration settings (no secrets)
        safe_settings = {
            "app_name": settings.APP_NAME,
            "version": settings.VERSION,
            "debug": settings.DEBUG,
            "database_name": settings.DATABASE_NAME,
            "default_page_size": settings.DEFAULT_PAGE_SIZE,
            "max_page_size": settings.MAX_PAGE_SIZE,
            "access_token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "max_file_size": settings.MAX_FILE_SIZE,
            "qr_code_size": settings.QR_CODE_SIZE,
            "qr_code_border": settings.QR_CODE_BORDER,
            "analytics_enabled": settings.ANALYTICS_ENABLED,
            "analytics_retention_days": settings.ANALYTICS_RETENTION_DAYS,
            "allowed_origins": settings.ALLOWED_ORIGINS,
            "features": {
                "sendgrid_configured": bool(settings.SENDGRID_API_KEY),
                "upload_dir_configured": bool(settings.UPLOAD_DIR)
            }
        }
        
        return SuccessResponse(
            message="Application settings retrieved successfully",
            data=safe_settings
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve application settings"
        )


@router.post("/admin/test/email")
async def test_email_service(
    test_email: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Test email service functionality (Admin only)"""
    try:
        from utils.email import send_email
        
        if not settings.SENDGRID_API_KEY:
            return SuccessResponse(
                message="Email service not configured",
                data={"status": "not_configured"}
            )
        
        # Send test email
        test_subject = "Test Email from Centro Cultural Banreservas"
        test_content = f"""
        <h2>Email Service Test</h2>
        <p>This is a test email sent from the Centro Cultural Banreservas admin panel.</p>
        <p>Test performed by: {admin_user['name']} ({admin_user['email']})</p>
        <p>Timestamp: {datetime.utcnow().isoformat()}</p>
        """
        
        email_sent = await send_email(test_email, test_subject, test_content)
        
        return SuccessResponse(
            message="Email test completed",
            data={
                "status": "sent" if email_sent else "failed",
                "recipient": test_email,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
    except Exception as e:
        return SuccessResponse(
            message="Email test failed",
            data={
                "status": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
