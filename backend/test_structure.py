#!/usr/bin/env python3
"""
Test script to verify the new modular backend structure
"""

import sys
import os
import asyncio
import subprocess

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)


async def test_imports():
    """Test that all modules can be imported successfully"""
    print("🧪 Testing module imports...")
    
    try:
        # Test core modules
        from core import settings, database
        print("✅ Core modules imported successfully")
        
        # Test models
        from models import User, Event, Reservation, SuccessResponse
        print("✅ Model classes imported successfully")
        
        # Test services
        from services import user_service, event_service
        print("✅ Service modules imported successfully")
        
        # Test API routers
        from api import (
            auth_router, users_router, events_router, 
            reservations_router, checkin_router, dashboard_router,
            analytics_router, reports_router, admin_router
        )
        print("✅ API routers imported successfully")
        
        # Test utilities
        from utils import (
            send_email, validate_user_data, generate_qr_code
        )
        print("✅ Utility functions imported successfully")
        
        # Test main app
        from main import app
        print("✅ Main FastAPI app imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False


async def test_database_connection():
    """Test database connection"""
    print("\n🗄️  Testing database connection...")
    
    try:
        from core.database import database
        
        # Initialize database
        await database.initialize()
        
        # Test health check
        health = await database.health_check()
        
        if health.get("status") == "connected":
            print("✅ Database connection successful")
            print(f"   Database: {health.get('database')}")
            print(f"   Collections: {health.get('collections', 0)}")
            return True
        else:
            print(f"❌ Database connection failed: {health}")
            return False
            
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False


async def test_configuration():
    """Test configuration settings"""
    print("\n⚙️  Testing configuration...")
    
    try:
        from core.config import settings
        
        print(f"✅ App Name: {settings.APP_NAME}")
        print(f"✅ Version: {settings.VERSION}")
        print(f"✅ Database Name: {settings.DATABASE_NAME}")
        print(f"✅ JWT Algorithm: {settings.ALGORITHM}")
        print(f"✅ Default Page Size: {settings.DEFAULT_PAGE_SIZE}")
        
        # Check if critical settings are configured
        if settings.SECRET_KEY == "your-secret-key-change-in-production":
            print("⚠️  WARNING: Using default SECRET_KEY - change in production!")
        
        if not settings.SENDGRID_API_KEY:
            print("⚠️  WARNING: SendGrid API key not configured - emails disabled")
        
        return True
        
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False


def test_file_structure():
    """Test that all expected files exist"""
    print("\n📁 Testing file structure...")
    
    expected_files = [
        "main.py",
        "requirements.txt",
        "core/__init__.py",
        "core/config.py",
        "core/database.py",
        "core/security.py",
        "core/analytics_init.py",
        "models/__init__.py",
        "models/users.py",
        "models/events.py",
        "models/reservations.py",
        "models/common.py",
        "services/__init__.py",
        "services/user_service.py",
        "services/event_service.py",
        "utils/__init__.py",
        "utils/email.py",
        "utils/validation.py",
        "utils/qr_codes.py",
        "api/__init__.py",
        "api/auth.py",
        "api/users.py",
        "api/events.py",
        "api/reservations.py",
        "api/checkin.py",
        "api/dashboard.py",
        "api/analytics.py",
        "api/reports.py",
        "api/admin.py"
    ]
    
    missing_files = []
    
    for file_path in expected_files:
        full_path = os.path.join(backend_dir, file_path)
        if not os.path.exists(full_path):
            missing_files.append(file_path)
        else:
            print(f"✅ {file_path}")
    
    if missing_files:
        print(f"\n❌ Missing files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("\n✅ All expected files exist")
    return True


async def test_api_endpoints():
    """Test that API endpoints are properly defined"""
    print("\n🚀 Testing API endpoints...")
    
    try:
        from main import app
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    if method != 'HEAD':  # Skip HEAD methods
                        routes.append(f"{method} {route.path}")
        
        # Expected core endpoints
        expected_endpoints = [
            "GET /",
            "GET /health",
            "POST /api/register",
            "POST /api/login",
            "GET /api/me",
            "GET /api/events",
            "POST /api/events",
            "GET /api/reservations",
            "POST /api/reservations",
            "POST /api/checkin",
            "GET /api/dashboard/stats"
        ]
        
        print(f"✅ Total routes defined: {len(routes)}")
        
        missing_endpoints = []
        for endpoint in expected_endpoints:
            if endpoint in routes:
                print(f"✅ {endpoint}")
            else:
                missing_endpoints.append(endpoint)
        
        if missing_endpoints:
            print(f"\n⚠️  Missing expected endpoints:")
            for endpoint in missing_endpoints:
                print(f"   - {endpoint}")
        
        return len(missing_endpoints) == 0
        
    except Exception as e:
        print(f"❌ API endpoints test failed: {e}")
        return False


def create_migration_guide():
    """Create migration guide from old to new structure"""
    print("\n📋 Creating migration guide...")
    
    migration_content = """
# MIGRATION GUIDE: server.py → Modular Structure

## 🎯 OVERVIEW
This guide helps you migrate from the monolithic server.py (3,196 lines) to the new modular structure.

## 📁 NEW STRUCTURE
```
backend/
├── main.py                 # NEW entry point (replaces server.py)
├── core/                   # Core functionality
│   ├── config.py          # Configuration management
│   ├── database.py        # Database connection & operations
│   ├── security.py        # JWT & password utilities
│   └── analytics_init.py  # Analytics initialization
├── models/                 # Pydantic models (extracted from server.py)
│   ├── users.py           # User-related models
│   ├── events.py          # Event-related models
│   ├── reservations.py    # Reservation & check-in models
│   └── common.py          # Common response models
├── services/               # Business logic
│   ├── user_service.py    # User operations
│   └── event_service.py   # Event operations
├── utils/                  # Utility functions
│   ├── email.py           # Email sending (SendGrid)
│   ├── validation.py      # Data validation
│   └── qr_codes.py        # QR code generation
└── api/                    # API endpoints (modular)
    ├── auth.py            # Authentication endpoints
    ├── users.py           # User management
    ├── events.py          # Event management
    ├── reservations.py    # Reservation system
    ├── checkin.py         # Check-in system
    ├── dashboard.py       # Dashboard data
    ├── analytics.py       # Analytics endpoints
    ├── reports.py         # Report generation
    └── admin.py           # Admin functions
```

## 🔄 MIGRATION STEPS

### Step 1: Backup Current System
```bash
# Keep server.py running on port 8004
cp server.py server_backup.py
```

### Step 2: Test New Structure
```bash
# Test the new modular structure
python3 test_structure.py

# Start new system on different port (8005)
cd backend
python3 -m uvicorn main:app --reload --port 8005
```

### Step 3: Verify Compatibility
```bash
# Test both systems side by side
curl http://localhost:8004/  # Old system
curl http://localhost:8005/  # New system

# Compare API responses
curl http://localhost:8004/api/events
curl http://localhost:8005/api/events
```

### Step 4: Switch Production
```bash
# Update frontend to use new backend
# Change API_BASE_URL from :8004 to :8005

# Stop old server
# Start new server on port 8004
python3 -m uvicorn main:app --reload --port 8004
```

## 🔍 KEY CHANGES

### Database Connection
- **Old**: Direct MongoClient in server.py
- **New**: Centralized in core/database.py with health checks

### Authentication
- **Old**: JWT functions scattered in server.py
- **New**: Organized in core/security.py with proper error handling

### API Structure
- **Old**: All endpoints in server.py (3,196 lines)
- **New**: Modular routers in api/ directory (50-400 lines each)

### Models
- **Old**: Pydantic models mixed with endpoints
- **New**: Organized by domain in models/ directory

### Business Logic
- **Old**: Mixed with API endpoints
- **New**: Separated into services/ directory

## ⚠️ BREAKING CHANGES
**NONE** - The new structure maintains 100% API compatibility

## 🧪 TESTING CHECKLIST
- [ ] All imports work correctly
- [ ] Database connection successful
- [ ] API endpoints respond correctly
- [ ] Authentication works
- [ ] User registration/login
- [ ] Event creation/retrieval
- [ ] Reservation system
- [ ] Check-in functionality
- [ ] Dashboard stats
- [ ] Frontend compatibility

## 🚀 BENEFITS
✅ **Maintainability**: Reduced from 3,196 lines to ~50-400 lines per module
✅ **Testability**: Each module can be tested independently
✅ **Scalability**: Easy to add new features
✅ **Debugging**: Easier to locate and fix issues
✅ **Team Development**: Multiple developers can work on different modules
✅ **Documentation**: Self-documenting structure

## 🔧 CONFIGURATION
The new structure uses the same environment variables as the old system:
- MONGO_URL
- SECRET_KEY
- SENDGRID_API_KEY
- DEBUG

## 📞 ROLLBACK PLAN
If issues arise, simply switch back to server.py:
```bash
# Stop new system
# Start old system
python3 -m uvicorn server:app --reload --port 8004
```

All data remains intact as database structure is unchanged.
"""
    
    try:
        with open(os.path.join(backend_dir, "MIGRATION_GUIDE.md"), "w") as f:
            f.write(migration_content)
        
        print("✅ Migration guide created: MIGRATION_GUIDE.md")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create migration guide: {e}")
        return False


async def main():
    """Run all tests"""
    print("🎯 Centro Cultural Banreservas - Backend Structure Test")
    print("=" * 60)
    
    # Track test results
    results = []
    
    # Run tests
    results.append(("File Structure", test_file_structure()))
    results.append(("Module Imports", await test_imports()))
    results.append(("Configuration", await test_configuration()))
    results.append(("Database Connection", await test_database_connection()))
    results.append(("API Endpoints", await test_api_endpoints()))
    results.append(("Migration Guide", create_migration_guide()))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:<8} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResult: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! The modular structure is ready.")
        print("\n🚀 Next steps:")
        print("1. Start the new backend: python3 -m uvicorn main:app --reload --port 8005")
        print("2. Test with frontend")
        print("3. Migrate production when ready")
    else:
        print(f"\n⚠️  {total - passed} tests failed. Please fix issues before proceeding.")
    
    return passed == total


if __name__ == "__main__":
    asyncio.run(main())
