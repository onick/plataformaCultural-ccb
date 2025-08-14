"""
Authentication API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta

from models.users import UserCreate, UserLogin, PasswordReset, PasswordResetConfirm
from models.common import SuccessResponse, ErrorResponse
from core.security import (
    create_access_token, 
    get_current_user, 
    hash_password, 
    generate_password_reset_token,
    verify_password_reset_token
)
from core.database import database
from core.config import settings
from services.user_service import user_service
from utils.email import send_password_reset_email

router = APIRouter()


@router.post("/register", response_model=SuccessResponse)
async def register(user_data: UserCreate):
    """Register a new user"""
    try:
        new_user = await user_service.create_user(user_data)
        
        return SuccessResponse(
            message="User registered successfully",
            data=new_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login")
async def login(user_credentials: UserLogin):
    """Authenticate user and return access token"""
    try:
        auth_result = await user_service.authenticate_user(
            user_credentials.email, 
            user_credentials.password
        )
        
        return auth_result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return SuccessResponse(
        message="User profile retrieved successfully",
        data=current_user
    )


@router.post("/refresh-token")
async def refresh_access_token(current_user: dict = Depends(get_current_user)):
    """Refresh access token for current user"""
    try:
        # Create new access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": current_user["id"], "email": current_user["email"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(password_reset: PasswordReset):
    """Request password reset"""
    try:
        # Find user by email
        user = database.users.find_one({
            "email": password_reset.email,
            "deleted": False
        })
        
        if not user:
            # Don't reveal if email exists or not for security
            return SuccessResponse(
                message="If the email exists, a password reset link has been sent"
            )
        
        # Generate reset token
        reset_token = generate_password_reset_token(user["id"])
        
        # Send reset email
        email_sent = await send_password_reset_email(
            user["email"],
            user["name"],
            reset_token
        )
        
        if email_sent:
            return SuccessResponse(
                message="Password reset link has been sent to your email"
            )
        else:
            # Don't fail completely if email doesn't send
            return SuccessResponse(
                message="Password reset link has been sent to your email"
            )
            
    except Exception as e:
        # Don't reveal internal errors for security
        return SuccessResponse(
            message="If the email exists, a password reset link has been sent"
        )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(password_reset_data: PasswordResetConfirm):
    """Reset password using reset token"""
    try:
        # Verify reset token
        user_id = verify_password_reset_token(password_reset_data.token)
        
        # Find user
        user = database.users.find_one({"id": user_id, "deleted": False})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash new password
        hashed_password = hash_password(password_reset_data.new_password)
        
        # Update password
        result = database.users.update_one(
            {"id": user_id},
            {"$set": {"password": hashed_password}}
        )
        
        if result.modified_count > 0:
            return SuccessResponse(
                message="Password reset successfully"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset password"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


@router.post("/logout", response_model=SuccessResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout current user (invalidate token on client side)"""
    # Note: With JWT tokens, we don't maintain server-side sessions
    # The client should discard the token to effectively log out
    return SuccessResponse(
        message="Logged out successfully"
    )


@router.post("/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify if current token is valid"""
    return {
        "valid": True,
        "user_id": current_user["id"],
        "email": current_user["email"],
        "is_admin": current_user.get("is_admin", False)
    }
