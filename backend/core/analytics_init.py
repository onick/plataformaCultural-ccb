"""
Analytics initialization module
Handles startup and shutdown of analytics systems
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Analytics modules (imported safely)
analytics = None
performance_tracker = None
dashboard_manager = None
user_segmentation = None

try:
    from analytics.tracker import analytics, performance_tracker
    from analytics.dashboard import dashboard_manager
    from analytics.segmentation import user_segmentation
    ANALYTICS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Analytics modules not available: {e}")
    ANALYTICS_AVAILABLE = False


async def initialize_analytics():
    """Initialize all analytics systems"""
    if not ANALYTICS_AVAILABLE:
        logger.info("📊 Analytics disabled - modules not available")
        return
    
    try:
        if analytics:
            await analytics.initialize()
            logger.info("✅ Analytics tracker initialized")
        
        if dashboard_manager:
            await dashboard_manager.initialize()
            logger.info("✅ Dashboard manager initialized")
        
        if user_segmentation:
            await user_segmentation.initialize()
            logger.info("✅ User segmentation initialized")
            
        logger.info("📊 All analytics systems initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize analytics: {e}")
        # Continue without analytics rather than crash
        pass


async def cleanup_analytics():
    """Cleanup all analytics systems"""
    if not ANALYTICS_AVAILABLE:
        return
    
    try:
        if dashboard_manager:
            await dashboard_manager.cleanup()
            logger.info("✅ Analytics cleanup completed")
    except Exception as e:
        logger.error(f"❌ Failed to cleanup analytics: {e}")


def get_analytics_tracker():
    """Get analytics tracker if available"""
    return analytics if ANALYTICS_AVAILABLE else None


def get_performance_tracker():
    """Get performance tracker if available"""
    return performance_tracker if ANALYTICS_AVAILABLE else None


def get_dashboard_manager():
    """Get dashboard manager if available"""
    return dashboard_manager if ANALYTICS_AVAILABLE else None


def get_user_segmentation():
    """Get user segmentation if available"""
    return user_segmentation if ANALYTICS_AVAILABLE else None
