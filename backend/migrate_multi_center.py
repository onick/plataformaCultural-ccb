#!/usr/bin/env python3
"""
Migration script for multi-center system implementation

This script adds the 'center' and 'role' fields to existing collections
and creates the new 'centers' collection with initial data.
"""

import os
import sys
from datetime import datetime
from pymongo import MongoClient

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.config import settings
from core.database import database


def migrate_multi_center():
    """
    Main migration function for multi-center system
    """
    print("🏢 Starting Multi-Center Migration...")
    
    try:
        # Initialize database connection
        print("🔌 Connecting to database...")
        from pymongo import MongoClient
        
        # Connect directly to MongoDB for migration
        client = MongoClient(settings.MONGO_URL)
        db = client[settings.DATABASE_NAME]
        
        # Update global database object
        database.db = db
        
        print("✅ Database connection established")
        
        # 1. Create centers collection with initial data
        create_centers_collection()
        
        # 2. Add center field to existing collections
        migrate_users_collection()
        migrate_events_collection()
        migrate_reservations_collection()
        
        # 3. Update indexes for better performance
        create_center_indexes()
        
        print("✅ Multi-Center Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        raise


def create_centers_collection():
    """
    Create the centers collection with initial Santo Domingo and Santiago data
    """
    print("📋 Creating centers collection...")
    
    # Check if centers collection already exists
    if "centers" in database.db.list_collection_names():
        print("⚠️  Centers collection already exists. Skipping creation.")
        return
    
    centers_data = [
        {
            "id": "santo-domingo",
            "name": "Centro Cultural Banreservas Santo Domingo",
            "city": "Santo Domingo",
            "address": "Av. Winston Churchill, Plaza de la Cultura",
            "phone": "(809) 685-2000",
            "email": "info.sd@banreservas.com",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        },
        {
            "id": "santiago",
            "name": "Centro Cultural Banreservas Santiago",
            "city": "Santiago",
            "address": "Calle del Sol #50, Santiago",
            "phone": "(809) 582-5000",
            "email": "info.santiago@banreservas.com",
            "is_active": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    ]
    
    result = database.db.centers.insert_many(centers_data)
    print(f"✅ Created centers collection with {len(result.inserted_ids)} centers")


def migrate_users_collection():
    """
    Add center and role fields to existing users
    """
    print("👥 Migrating users collection...")
    
    # Count existing users
    total_users = database.db.users.count_documents({})
    print(f"📊 Found {total_users} users to migrate")
    
    if total_users == 0:
        print("⚠️  No users found. Skipping users migration.")
        return
    
    # Update all users without center field
    users_without_center = database.db.users.count_documents({"center": {"$exists": False}})
    if users_without_center > 0:
        result = database.db.users.update_many(
            {"center": {"$exists": False}},
            {"$set": {"center": "santo-domingo"}}
        )
        print(f"✅ Added center field to {result.modified_count} users")
    
    # Update all users without role field
    users_without_role = database.db.users.count_documents({"role": {"$exists": False}})
    if users_without_role > 0:
        # Set role based on is_admin field
        # Admin users become admin_local, regular users become viewer
        result_admin = database.db.users.update_many(
            {"role": {"$exists": False}, "is_admin": True},
            {"$set": {"role": "admin_local"}}
        )
        
        result_viewer = database.db.users.update_many(
            {"role": {"$exists": False}, "is_admin": {"$ne": True}},
            {"$set": {"role": "viewer"}}
        )
        
        print(f"✅ Added role field: {result_admin.modified_count} admin_local, {result_viewer.modified_count} viewers")
    
    # Identify the super admin user (you can modify this email)
    super_admin_email = input("Enter the email for the super admin user (or press Enter to skip): ").strip()
    if super_admin_email:
        result = database.db.users.update_one(
            {"email": super_admin_email},
            {"$set": {"role": "super_admin", "center": "santo-domingo"}}
        )
        if result.modified_count > 0:
            print(f"✅ Set {super_admin_email} as super_admin")
        else:
            print(f"⚠️  User {super_admin_email} not found")


def migrate_events_collection():
    """
    Add center field to existing events
    """
    print("📅 Migrating events collection...")
    
    # Count existing events
    total_events = database.db.events.count_documents({})
    print(f"📊 Found {total_events} events to migrate")
    
    if total_events == 0:
        print("⚠️  No events found. Skipping events migration.")
        return
    
    # Update all events without center field
    events_without_center = database.db.events.count_documents({"center": {"$exists": False}})
    if events_without_center > 0:
        result = database.db.events.update_many(
            {"center": {"$exists": False}},
            {"$set": {"center": "santo-domingo"}}
        )
        print(f"✅ Added center field to {result.modified_count} events")


def migrate_reservations_collection():
    """
    Add center field to existing reservations
    """
    print("🎫 Migrating reservations collection...")
    
    # Count existing reservations
    total_reservations = database.db.reservations.count_documents({})
    print(f"📊 Found {total_reservations} reservations to migrate")
    
    if total_reservations == 0:
        print("⚠️  No reservations found. Skipping reservations migration.")
        return
    
    # Update all reservations without center field
    reservations_without_center = database.db.reservations.count_documents({"center": {"$exists": False}})
    if reservations_without_center > 0:
        result = database.db.reservations.update_many(
            {"center": {"$exists": False}},
            {"$set": {"center": "santo-domingo"}}
        )
        print(f"✅ Added center field to {result.modified_count} reservations")


def create_center_indexes():
    """
    Create indexes for better performance on center-filtered queries
    """
    print("🔍 Creating center-based indexes...")
    
    try:
        # Users collection indexes
        database.db.users.create_index([("center", 1)])
        database.db.users.create_index([("role", 1)])
        database.db.users.create_index([("center", 1), ("role", 1)])
        
        # Events collection indexes
        database.db.events.create_index([("center", 1)])
        database.db.events.create_index([("center", 1), ("date", 1)])
        database.db.events.create_index([("center", 1), ("published", 1)])
        
        # Reservations collection indexes
        database.db.reservations.create_index([("center", 1)])
        database.db.reservations.create_index([("center", 1), ("status", 1)])
        database.db.reservations.create_index([("center", 1), ("event_id", 1)])
        
        # Centers collection indexes
        database.db.centers.create_index([("id", 1)], unique=True)
        database.db.centers.create_index([("is_active", 1)])
        
        print("✅ Created center-based indexes for improved performance")
        
    except Exception as e:
        print(f"⚠️  Index creation warning: {str(e)}")


def rollback_migration():
    """
    Rollback the migration (remove center and role fields)
    WARNING: This will remove all center and role data!
    """
    print("🔄 Rolling back multi-center migration...")
    
    confirm = input("⚠️  This will PERMANENTLY remove all center and role data. Type 'CONFIRM' to proceed: ")
    if confirm != "CONFIRM":
        print("❌ Rollback cancelled")
        return
    
    try:
        # Initialize database connection for rollback
        from pymongo import MongoClient
        client = MongoClient(settings.MONGO_URL)
        db = client[settings.DATABASE_NAME]
        
        # Remove center and role fields from users
        db.users.update_many({}, {"$unset": {"center": "", "role": ""}})
        
        # Remove center field from events
        db.events.update_many({}, {"$unset": {"center": ""}})
        
        # Remove center field from reservations
        db.reservations.update_many({}, {"$unset": {"center": ""}})
        
        # Drop centers collection
        db.centers.drop()
        
        print("✅ Migration rollback completed")
        
    except Exception as e:
        print(f"❌ Rollback failed: {str(e)}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Multi-Center Migration Script")
    parser.add_argument("--rollback", action="store_true", help="Rollback the migration")
    args = parser.parse_args()
    
    if args.rollback:
        rollback_migration()
    else:
        migrate_multi_center()