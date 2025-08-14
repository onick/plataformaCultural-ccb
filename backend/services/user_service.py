"""
User service - Business logic for user operations
"""

import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status

from core.database import database
from core.security import hash_password, verify_password, create_access_token
from models.users import UserCreate, UserUpdate, User, BulkImportResult
from utils.email import send_welcome_email, send_password_reset_email
from utils.validation import validate_user_data

logger = logging.getLogger(__name__)


class UserService:
    """Service for user-related operations"""
    
    @staticmethod
    async def create_user(user_data: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        try:
            # Validate user data
            await validate_user_data(user_data)
            
            # Check if user already exists
            existing_user = database.users.find_one({"email": user_data.email})
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create new user
            user_id = str(uuid.uuid4())
            hashed_password = hash_password(user_data.password)
            
            user_doc = {
                "id": user_id,
                "name": user_data.name,
                "email": user_data.email,
                "password": hashed_password,
                "phone": user_data.phone,
                "age": user_data.age,
                "location": user_data.location,
                "center": user_data.center,
                "role": user_data.role,
                "is_admin": False,
                "deleted": False,
                "created_at": datetime.utcnow().isoformat(),
                "last_login": None
            }
            
            # Insert user into database
            result = database.users.insert_one(user_doc)
            
            if result.inserted_id:
                # Send welcome email (async)
                try:
                    await send_welcome_email(user_data.email, user_data.name)
                except Exception as e:
                    logger.warning(f"Failed to send welcome email: {e}")
                
                # Return user without password
                user_doc.pop("password")
                user_doc.pop("_id", None)
                
                logger.info(f"User created successfully: {user_data.email}")
                return user_doc
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user"
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return access token"""
        try:
            # Find user by email
            user = database.users.find_one({"email": email, "deleted": False})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Verify password
            if not verify_password(password, user["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            
            # Update last login
            database.users.update_one(
                {"id": user["id"]},
                {"$set": {"last_login": datetime.utcnow().isoformat()}}
            )
            
            # Create access token with center and role information
            access_token = create_access_token(
                data={
                    "sub": user["id"], 
                    "email": user["email"],
                    "center": user.get("center", "santo-domingo"),
                    "role": user.get("role", "viewer")
                }
            )
            
            # Remove password from response
            user.pop("password")
            user.pop("_id", None)
            
            logger.info(f"User authenticated: {email}")
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": user
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error authenticating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        try:
            user = database.users.find_one({"id": user_id, "deleted": False})
            if user:
                user.pop("password", None)
                user.pop("_id", None)
            return user
        except Exception as e:
            logger.error(f"Error getting user by ID: {e}")
            return None
    
    @staticmethod
    async def update_user(user_id: str, update_data: UserUpdate) -> Dict[str, Any]:
        """Update user information"""
        try:
            # Get current user
            current_user = await UserService.get_user_by_id(user_id)
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            # Prepare update document
            update_doc = {}
            for field, value in update_data.dict(exclude_unset=True).items():
                if field == "email" and value != current_user["email"]:
                    # Check if email is already taken
                    existing = database.users.find_one({"email": value, "deleted": False})
                    if existing and existing["id"] != user_id:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Email already in use"
                        )
                update_doc[field] = value
            
            if update_doc:
                update_doc["updated_at"] = datetime.utcnow().isoformat()
                
                # Update user
                result = database.users.update_one(
                    {"id": user_id},
                    {"$set": update_doc}
                )
                
                if result.modified_count > 0:
                    # Get updated user
                    updated_user = await UserService.get_user_by_id(user_id)
                    logger.info(f"User updated: {user_id}")
                    return updated_user
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Failed to update user"
                    )
            else:
                return current_user
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )


user_service = UserService()
