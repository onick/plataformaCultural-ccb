"""
Centro Cultural Banreservas - API Backend Modular
Entry point principal para la aplicación refactorizada
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

# Core modules
from core.config import settings, get_cors_config
from core.database import database
from core.analytics_init import initialize_analytics, cleanup_analytics

# API routers
from api.auth import router as auth_router
from api.users import router as users_router
from api.events import router as events_router
from api.reservations import router as reservations_router
from api.checkin import router as checkin_router
from api.dashboard import router as dashboard_router
from api.analytics import router as analytics_router
from api.reports import router as reports_router
from api.admin import router as admin_router
from api.static import router as static_router
from api.centers import router as centers_router
from api.notifications import router as notifications_router
from api.invitations import router as invitations_router
from api.interests import router as interests_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("🚀 Starting Centro Cultural Banreservas API...")
    
    try:
        # Initialize database
        await database.initialize()
        logger.info("✅ Database initialized")
        
        # Initialize analytics
        await initialize_analytics()
        logger.info("✅ Analytics initialized")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🔄 Shutting down...")
        await cleanup_analytics()
        await database.close()
        logger.info("✅ Cleanup completed")


# Create FastAPI app with lifecycle
app = FastAPI(
    title="Centro Cultural Banreservas API",
    description="API para gestión de eventos culturales y usuarios",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Import security middleware
# from core.security_middleware import setup_security_middleware

# CORS configuration - SECURE
cors_config = get_cors_config()
app.add_middleware(
    CORSMiddleware,
    **cors_config
)

# Setup security middleware
# setup_security_middleware(app)

# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Centro Cultural Banreservas API is running",
        "version": "2.0.0",
        "status": "healthy"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Check database connection
        db_status = await database.health_check()
        
        return {
            "status": "healthy",
            "version": "2.0.0",
            "database": db_status,
            "timestamp": database.get_current_timestamp()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": database.get_current_timestamp()
        }

# Include API routers with prefixes
app.include_router(auth_router, prefix="/api", tags=["Authentication"])
app.include_router(users_router, prefix="/api", tags=["Users"])
app.include_router(events_router, prefix="/api", tags=["Events"])
app.include_router(reservations_router, prefix="/api", tags=["Reservations"])
app.include_router(checkin_router, prefix="/api", tags=["Check-in"])
app.include_router(dashboard_router, prefix="/api", tags=["Dashboard"])
app.include_router(analytics_router, prefix="/api", tags=["Analytics"])
app.include_router(reports_router, prefix="/api", tags=["Reports"])
app.include_router(admin_router, prefix="/api", tags=["Admin"])
app.include_router(centers_router, prefix="/api", tags=["Centers"])
app.include_router(notifications_router, prefix="/api", tags=["Notifications"])
app.include_router(invitations_router, prefix="/api", tags=["Invitations"])
app.include_router(interests_router, prefix="/api", tags=["User Interests"])
app.include_router(static_router, tags=["Static Files"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8004,
        reload=True,
        log_level="info"
    )
