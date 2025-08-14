"""
Security utilities for JWT authentication and password hashing
"""

import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Literal
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from core.config import settings
from core.database import database

# Multi-center system types
UserRole = Literal['super_admin', 'admin_local', 'editor_local', 'viewer']
CenterID = Literal['santo-domingo', 'santiago']

# HTTP Bearer token scheme
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with center and role information"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    
    # Ensure center and role are included in JWT
    if 'center' not in to_encode:
        to_encode['center'] = 'santo-domingo'  # Default center
    if 'role' not in to_encode:
        to_encode['role'] = 'viewer'  # Default role
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user with center and role information"""
    token = credentials.credentials
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = database.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Remove password from response
    user.pop("password", None)
    user.pop("_id", None)
    
    # Ensure user has center and role (for backward compatibility)
    if 'center' not in user:
        user['center'] = 'santo-domingo'
    if 'role' not in user:
        user['role'] = 'admin_local' if user.get('is_admin', False) else 'viewer'
    
    return user


async def get_admin_user(current_user: Dict = Depends(get_current_user)):
    """Get current user and verify admin privileges (legacy compatibility)"""
    if not current_user.get("is_admin", False) and current_user.get("role") not in ['super_admin', 'admin_local']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return current_user


def generate_password_reset_token(user_id: str) -> str:
    """Generate password reset token"""
    expire = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    to_encode = {
        "sub": user_id,
        "exp": expire,
        "type": "password_reset"
    }
    
    return jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )


def verify_password_reset_token(token: str) -> str:
    """Verify password reset token and return user_id"""
    payload = verify_token(token)
    
    if payload.get("type") != "password_reset":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token type"
        )
    
    return payload.get("sub")


# Multi-center permission decorators and utilities
def check_permission(user: Dict, resource: str, action: str, target_center: str = None) -> bool:
    """
    Check if user has permission to perform action on resource
    """
    user_role = user.get('role', 'viewer')
    user_center = user.get('center', 'santo-domingo')
    
    # Super admin can do anything
    if user_role == 'super_admin':
        return True
    
    # Check if action is on user's center
    if target_center and target_center != user_center:
        return False
    
    # Define permissions for each role
    permissions = {
        'admin_local': ['read', 'create', 'update', 'delete'],
        'editor_local': ['read', 'create', 'update'],
        'viewer': ['read']
    }
    
    return action in permissions.get(user_role, [])


def require_permission(resource: str, action: str):
    """
    Decorator to require specific permission
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get current_user from function arguments
            current_user = None
            for arg in args:
                if isinstance(arg, dict) and 'role' in arg:
                    current_user = arg
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if not check_permission(current_user, resource, action):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions for {action} on {resource}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


async def get_super_admin_user(current_user: Dict = Depends(get_current_user)):
    """Get current user and verify super admin privileges"""
    if current_user.get("role") != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin privileges required"
        )
    
    return current_user


async def get_local_admin_user(current_user: Dict = Depends(get_current_user)):
    """Get current user and verify local admin privileges"""
    if current_user.get("role") not in ["super_admin", "admin_local"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Local admin privileges required"
        )
    
    return current_user


async def get_editor_user(current_user: Dict = Depends(get_current_user)):
    """Get current user and verify editor privileges"""
    if current_user.get("role") not in ["super_admin", "admin_local", "editor_local"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor privileges required"
        )
    
    return current_user


def filter_by_center(query_filter: Dict, current_user: Dict) -> Dict:
    """
    Add center filter to MongoDB query based on user role and center
    """
    user_role = current_user.get('role', 'viewer')
    user_center = current_user.get('center', 'santo-domingo')
    
    # Super admin can see all centers (no filter added)
    if user_role == 'super_admin':
        return query_filter
    
    # Other users only see their center
    query_filter['center'] = user_center
    return query_filter
