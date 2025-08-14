#!/usr/bin/env python3
"""
Migration script to add check-in codes to existing reservations
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
import string
import random

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client.cultural_center

def generate_checkin_code():
    """Generate unique 8-character alphanumeric check-in code"""
    # Use uppercase letters and numbers for readability
    characters = string.ascii_uppercase + string.digits
    # Remove confusing characters (O, 0, I, 1, L)
    characters = characters.replace('O', '').replace('0', '').replace('I', '').replace('1', '').replace('L', '')
    
    return ''.join(random.choice(characters) for _ in range(8))

def migrate_reservations():
    """Add check-in codes to existing reservations"""
    print("Starting migration to add check-in codes to existing reservations...")
    
    # Find all reservations without check-in codes
    reservations_without_codes = list(db.reservations.find({"checkin_code": {"$exists": False}}))
    
    print(f"Found {len(reservations_without_codes)} reservations without check-in codes")
    
    updated_count = 0
    
    for reservation in reservations_without_codes:
        # Generate unique check-in code
        checkin_code = generate_checkin_code()
        
        # Ensure uniqueness
        while db.reservations.find_one({"checkin_code": checkin_code}):
            checkin_code = generate_checkin_code()
        
        # Update the reservation
        result = db.reservations.update_one(
            {"_id": reservation["_id"]},
            {"$set": {"checkin_code": checkin_code}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"Updated reservation {reservation['id']} with check-in code: {checkin_code}")
    
    print(f"\nMigration completed! Updated {updated_count} reservations with check-in codes.")

if __name__ == "__main__":
    migrate_reservations() 