"""
Database connection and operations for MongoDB
Centralizes all database logic
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from core.config import settings

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database manager"""
    
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        
    async def initialize(self):
        """Initialize database connection and indexes"""
        try:
            # Create MongoDB connection
            self.client = MongoClient(
                settings.MONGO_URL,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            
            # Test connection
            self.client.admin.command('ping')
            
            # Get database
            self.db = self.client[settings.DATABASE_NAME]
            
            # Create indexes for performance
            await self._create_indexes()
            
            logger.info(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise
    
    async def _create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("created_at")
            self.db.users.create_index("is_admin")
            self.db.users.create_index("deleted")
            self.db.users.create_index("location")
            self.db.users.create_index("age")
            self.db.users.create_index([
                ("name", "text"), 
                ("email", "text"), 
                ("location", "text")
            ])
            
            # Events collection indexes
            self.db.events.create_index("date")
            self.db.events.create_index("category")
            self.db.events.create_index("created_at")
            self.db.events.create_index("published")
            self.db.events.create_index([
                ("title", "text"),
                ("description", "text"),
                ("tags", "text")
            ])
            
            # Reservations collection indexes
            self.db.reservations.create_index("user_id")
            self.db.reservations.create_index("event_id")
            self.db.reservations.create_index("created_at")
            self.db.reservations.create_index("status")
            self.db.reservations.create_index("reservation_code", unique=True)
            
            # Check-ins collection indexes
            self.db.checkins.create_index("reservation_id")
            self.db.checkins.create_index("event_id")
            self.db.checkins.create_index("user_id")
            self.db.checkins.create_index("created_at")
            
            # Analytics collection indexes
            self.db.analytics.create_index("timestamp")
            self.db.analytics.create_index("event_type")
            self.db.analytics.create_index("user_id")
            
            logger.info("✅ Database indexes created successfully")
            
        except Exception as e:
            logger.warning(f"⚠️ Some indexes may already exist: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check database health"""
        try:
            if not self.client:
                return {"status": "disconnected", "error": "No client"}
            
            # Ping database
            result = self.client.admin.command('ping')
            
            # Get basic stats
            stats = self.db.command("dbstats")
            
            return {
                "status": "connected",
                "ping": result.get("ok", 0) == 1,
                "database": settings.DATABASE_NAME,
                "collections": stats.get("collections", 0),
                "dataSize": stats.get("dataSize", 0),
                "storageSize": stats.get("storageSize", 0)
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {"status": "error", "error": str(e)}
    
    async def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("✅ Database connection closed")
    
    def get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.utcnow().isoformat()
    
    # Collection getters for easy access
    @property
    def users(self):
        return self.db.users if self.db is not None else None
    
    @property 
    def events(self):
        return self.db.events if self.db is not None else None
    
    @property
    def reservations(self):
        return self.db.reservations if self.db is not None else None
    
    @property
    def checkins(self):
        return self.db.checkins if self.db is not None else None
    
    @property
    def analytics(self):
        return self.db.analytics if self.db is not None else None


# Global database instance
database = Database()
