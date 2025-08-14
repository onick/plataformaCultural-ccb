"""
User-related Pydantic models
"""

from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr

# Multi-center system types
UserRole = Literal['super_admin', 'admin_local', 'editor_local', 'viewer']
CenterID = Literal['santo-domingo', 'santiago']


class UserCreate(BaseModel):
    """Model for user registration"""
    name: str
    email: EmailStr
    password: str
    phone: str
    age: int
    location: str
    center: CenterID = 'santo-domingo'
    role: UserRole = 'viewer'


class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Model for user updates"""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    is_admin: Optional[bool] = None
    center: Optional[CenterID] = None
    role: Optional[UserRole] = None


class User(BaseModel):
    """User response model"""
    id: str
    name: str
    email: str
    phone: str
    age: int
    location: str
    is_admin: bool = False
    center: CenterID = 'santo-domingo'
    role: UserRole = 'viewer'
    created_at: Optional[str] = None


class BulkUserAction(BaseModel):
    """Model for bulk user actions"""
    user_ids: List[str]
    action: str  # "delete", "activate", "deactivate", "make_admin", "remove_admin", "change_center", "change_role"
    center: Optional[CenterID] = None  # For change_center action
    role: Optional[UserRole] = None  # For change_role action


class BulkImportResult(BaseModel):
    """Result model for bulk user import"""
    total_processed: int
    successful_imports: int
    failed_imports: int
    duplicate_emails: int
    errors: List[dict]
    imported_users: List[dict]


class PasswordReset(BaseModel):
    """Model for password reset request"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Model for password reset confirmation"""
    token: str
    new_password: str


class UserProfile(BaseModel):
    """Extended user profile model"""
    id: str
    name: str
    email: str
    phone: str
    age: int
    location: str
    is_admin: bool
    center: CenterID
    role: UserRole
    created_at: str
    last_login: Optional[str] = None
    total_reservations: Optional[int] = 0
    total_checkins: Optional[int] = 0
