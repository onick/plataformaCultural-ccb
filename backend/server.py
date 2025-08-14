from fastapi import FastAPI, HTTPException, Depends, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import csv
import pandas as pd
import io
import os
from datetime import datetime, timedelta
import jwt
import bcrypt
from pymongo import MongoClient
import uuid
import qrcode
import base64
from io import BytesIO
from email_validator import validate_email, EmailNotValidError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import logging
from PIL import Image

# Analytics imports
from analytics.tracker import analytics, performance_tracker
from analytics.dashboard import dashboard_manager
from analytics.segmentation import user_segmentation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Health check endpoint for Railway
@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment"""
    return {"status": "healthy", "service": "ccb-backend", "timestamp": datetime.utcnow()}

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Analytics initialization
@app.on_event("startup")
async def startup_event():
    """Initialize analytics systems and database indexes on startup"""
    try:
        await analytics.initialize()
        await dashboard_manager.initialize()
        await user_segmentation.initialize()
        logger.info("Analytics systems initialized successfully")
        
        # Create database indexes for better performance
        try:
            # Users collection indexes
            db.users.create_index("email", unique=True)
            db.users.create_index("created_at")
            db.users.create_index("is_admin")
            db.users.create_index("deleted")
            db.users.create_index("location")
            db.users.create_index("age")
            db.users.create_index([("name", "text"), ("email", "text"), ("location", "text")])
            
            # Reservations collection indexes
            db.reservations.create_index("user_id")
            db.reservations.create_index("event_id")
            db.reservations.create_index("created_at")
            db.reservations.create_index("status")
            
            # Events collection indexes
            db.events.create_index("date")
            db.events.create_index("category")
            db.events.create_index("created_at")
            
            logger.info("Database indexes created successfully")
        except Exception as index_error:
            logger.warning(f"Some indexes may already exist: {index_error}")
            
    except Exception as e:
        logger.error(f"Failed to initialize analytics: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup analytics systems on shutdown"""
    try:
        await dashboard_manager.cleanup()
        logger.info("Analytics systems cleaned up")
    except Exception as e:
        logger.error(f"Failed to cleanup analytics: {e}")

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.cultural_center

# JWT configuration
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# SendGrid configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
FROM_EMAIL = 'noreply@culturalcenter.com'  # You can change this to your verified sender

# Security
security = HTTPBearer()

# Event categories
EVENT_CATEGORIES = [
    "Dominican Cinema",
    "Classic Cinema", 
    "General Cinema",
    "Workshops",
    "Concerts",
    "Talks/Conferences",
    "Art Exhibitions",
    "3D Immersive Experiences"
]

# Models
class UserCreate(BaseModel):
    nombre: str
    apellido: Optional[str] = None
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    cedula: Optional[str] = None
    fecha_nacimiento: Optional[str] = None
    ocupacion: Optional[str] = None
    empresa: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    age: int
    location: str
    is_admin: bool = False
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: str
    updated_at: Optional[str] = None

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class EventCreate(BaseModel):
    title: str
    description: str
    category: str
    date: str
    time: str
    capacity: int
    location: str
    image_url: Optional[str] = None
    price: Optional[float] = 0.0
    tags: Optional[List[str]] = []
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    published: Optional[bool] = True

class Event(BaseModel):
    id: str
    title: str
    description: str
    category: str
    date: str
    time: str
    capacity: int
    location: str
    image_url: Optional[str] = None
    price: Optional[float] = 0.0
    tags: Optional[List[str]] = []
    requirements: Optional[str] = None
    contact_info: Optional[str] = None
    published: Optional[bool] = True
    available_spots: int
    created_at: str

class ReservationCreate(BaseModel):
    event_id: str
    notes: Optional[str] = None

class Reservation(BaseModel):
    id: str
    event_id: str
    user_id: str
    status: str  # confirmed, checked_in, cancelled
    qr_code: Optional[str] = None
    checkin_code: str  # 8-character unique code for check-in
    created_at: str

class BulkImportResult(BaseModel):
    total_processed: int
    successful_imports: int
    failed_imports: int
    duplicate_emails: int
    errors: List[dict]
    imported_users: List[dict]

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    location: Optional[str] = None
    is_admin: Optional[bool] = None

class BulkUserAction(BaseModel):
    user_ids: List[str]
    action: str  # "delete", "activate", "deactivate", "make_admin", "remove_admin"

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def generate_checkin_code() -> str:
    """Generate unique 8-character alphanumeric check-in code"""
    import string
    import random
    
    # Use uppercase letters and numbers for readability
    characters = string.ascii_uppercase + string.digits
    # Remove confusing characters (O, 0, I, 1, L)
    characters = characters.replace('O', '').replace('0', '').replace('I', '').replace('1', '').replace('L', '')
    
    return ''.join(random.choice(characters) for _ in range(8))

def generate_qr_code(data: str) -> str:
    """
    Genera un código QR optimizado para mejor compatibilidad con escáneres móviles
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,  # Mejor corrección de errores
        box_size=12,  # Tamaño de caja más grande para mejor legibilidad
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Crear imagen con mejor contraste
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Asegurar tamaño mínimo para escaneo móvil
    if img.size[0] < 200:
        img = img.resize((200, 200), Image.NEAREST)
    
    buffer = BytesIO()
    img.save(buffer, format='PNG', optimize=True)
    buffer.seek(0)
    
    img_str = base64.b64encode(buffer.read()).decode()
    return f"data:image/png;base64,{img_str}"

def send_email(to_email: str, subject: str, html_content: str, plain_content: str = None):
    """Send email using SendGrid"""
    try:
        if not SENDGRID_API_KEY:
            logger.warning("SendGrid API key not configured - email not sent")
            return False
            
        sg = SendGridAPIClient(api_key=SENDGRID_API_KEY)
        
        message = Mail(
            from_email=FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
            plain_text_content=plain_content or html_content
        )
        
        response = sg.send(message)
        logger.info(f"Email sent successfully to {to_email}, status: {response.status_code}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    """Send welcome email after registration"""
    subject = "Welcome to Cultural Center!"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Cultural Center!</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello {user_name}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Thank you for joining our Cultural Center community! We're excited to have you with us.
                </p>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    With your account, you can:
                </p>
                <ul style="color: #555; font-size: 16px; line-height: 1.6;">
                    <li>Browse our diverse cultural events</li>
                    <li>Make instant reservations</li>
                    <li>Get QR codes for quick check-in</li>
                    <li>View your reservation history</li>
                </ul>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Start exploring our events and reserve your spot today!
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="https://9e3637a1-65a6-4333-b260-4ab8a73085d8.preview.emergentagent.com" 
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Explore Events
                    </a>
                </div>
                <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
                    Cultural Center Visitor Management Platform
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_content = f"""
    Welcome to Cultural Center!
    
    Hello {user_name}!
    
    Thank you for joining our Cultural Center community! We're excited to have you with us.
    
    With your account, you can:
    - Browse our diverse cultural events
    - Make instant reservations
    - Get QR codes for quick check-in
    - View your reservation history
    
    Start exploring our events and reserve your spot today!
    
    Visit: https://9e3637a1-65a6-4333-b260-4ab8a73085d8.preview.emergentagent.com
    
    Cultural Center Visitor Management Platform
    """
    
    return send_email(user_email, subject, html_content, plain_content)

def send_reservation_confirmation_email(user_email: str, user_name: str, event_title: str, event_date: str, event_time: str, event_location: str, qr_code_data: str, checkin_code: str = ""):
    """Send reservation confirmation email with QR code"""
    subject = f"Reservation Confirmed: {event_title}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Reservation Confirmed!</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello {user_name}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Your reservation has been confirmed for:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                    <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">{event_title}</h3>
                    <p style="color: #555; margin: 5px 0;"><strong>Date:</strong> {event_date}</p>
                    <p style="color: #555; margin: 5px 0;"><strong>Time:</strong> {event_time}</p>
                    <p style="color: #555; margin: 5px 0;"><strong>Location:</strong> {event_location}</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <h3 style="color: #333;">Check-in Options</h3>
                    <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        <img src="{qr_code_data}" alt="QR Code" style="max-width: 200px; height: auto;" />
                    </div>
                    <p style="color: #666; font-size: 14px; margin-top: 10px;">
                        Option 1: Present this QR code at the entrance
                    </p>
                    {f'''
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #333; margin: 0 0 10px 0;">Option 2: Check-in Code</h4>
                        <div style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; font-family: monospace;">
                            {checkin_code}
                        </div>
                        <p style="color: #555; font-size: 14px; margin: 10px 0 0 0;">
                            Use this code at check-in or with your email/phone
                        </p>
                    </div>
                    ''' if checkin_code else ''}
                </div>
                
                <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #2d5016; margin: 0; font-size: 14px;">
                        <strong>Important:</strong> Please arrive 15 minutes before the event starts. 
                        Save this email or take a screenshot of the QR code for easy access.
                    </p>
                </div>
                
                <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
                    Cultural Center Visitor Management Platform
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_content = f"""
    Reservation Confirmed: {event_title}
    
    Hello {user_name}!
    
    Your reservation has been confirmed for:
    
    Event: {event_title}
    Date: {event_date}
    Time: {event_time}
    Location: {event_location}
    
    CHECK-IN OPTIONS:
    
    Option 1: Present the QR code at the entrance
    Option 2: Use your check-in code: {checkin_code if checkin_code else 'N/A'}
    Option 3: Check-in with your email or phone number
    
    Important: Please arrive 15 minutes before the event starts.
    
    Cultural Center Visitor Management Platform
    """
    
    return send_email(user_email, subject, html_content, plain_content)

def send_checkin_confirmation_email(user_email: str, user_name: str, event_title: str):
    """Send check-in confirmation email"""
    subject = f"Checked In: {event_title}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Successfully Checked In!</h1>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Hello {user_name}!</h2>
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    You have successfully checked in to:
                </p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0; text-align: center;">
                    <h3 style="color: #333; margin: 0; font-size: 20px;">{event_title}</h3>
                    <p style="color: #555; margin: 10px 0;">Enjoy the event!</p>
                </div>
                
                <p style="color: #555; font-size: 16px; line-height: 1.6;">
                    Thank you for being part of our cultural community. We hope you have a wonderful experience!
                </p>
                
                <p style="color: #777; font-size: 14px; text-align: center; margin-top: 30px;">
                    Cultural Center Visitor Management Platform
                </p>
            </div>
        </body>
    </html>
    """
    
    plain_content = f"""
    Successfully Checked In: {event_title}
    
    Hello {user_name}!
    
    You have successfully checked in to: {event_title}
    
    Enjoy the event!
    
    Thank you for being part of our cultural community. We hope you have a wonderful experience!
    
    Cultural Center Visitor Management Platform
    """
    
    return send_email(user_email, subject, html_content, plain_content)

def send_reservation_cancellation_email(user_email: str, user_name: str, event_title: str, event_date: str, event_time: str, event_location: str, cancellation_time: str):
    """Send reservation cancellation confirmation email"""
    try:
        # Parse cancellation time for formatting
        from datetime import datetime
        cancel_datetime = datetime.fromisoformat(cancellation_time.replace('Z', '+00:00'))
        formatted_cancel_time = cancel_datetime.strftime("%d de %B, %Y a las %H:%M")
        
        subject = f"Reserva Cancelada - {event_title}"
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0;">❌ Reserva Cancelada</h1>
                </div>
                
                <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #dc2626;">Hola {user_name},</h2>
                    
                    <p style="font-size: 16px;">Te confirmamos que tu reserva ha sido <strong>cancelada exitosamente</strong> para el siguiente evento:</p>
                    
                    <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #dc2626;">{event_title}</h3>
                        <p style="margin: 5px 0; color: #64748b;"><strong>📅 Fecha:</strong> {event_date}</p>
                        <p style="margin: 5px 0; color: #64748b;"><strong>🕐 Hora:</strong> {event_time}</p>
                        <p style="margin: 5px 0; color: #64748b;"><strong>📍 Ubicación:</strong> {event_location}</p>
                    </div>
                    
                    <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <p style="margin: 0; color: #92400e;"><strong>Cancelado el:</strong> {formatted_cancel_time}</p>
                    </div>
                    
                    <p style="font-size: 16px;">Tu lugar ya está disponible para otros usuarios. Si cambias de opinión, puedes hacer una nueva reserva (sujeto a disponibilidad).</p>
                    
                    <p style="font-size: 14px; color: #64748b;">Si tienes alguna pregunta, no dudes en contactarnos.</p>
                    
                    <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                        Saludos cordiales,<br>
                        <strong>Centro Cultural Banreservas</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_content = f"""
        Reserva Cancelada - {event_title}
        
        Hola {user_name},
        
        Te confirmamos que tu reserva ha sido cancelada exitosamente para el siguiente evento:
        
        Evento: {event_title}
        Fecha: {event_date}
        Hora: {event_time}
        Ubicación: {event_location}
        
        Cancelado el: {formatted_cancel_time}
        
        Tu lugar ya está disponible para otros usuarios. Si cambias de opinión, puedes hacer una nueva reserva (sujeto a disponibilidad).
        
        Si tienes alguna pregunta, no dudes en contactarnos.
        
        Saludos cordiales,
        Centro Cultural Banreservas
        """
        
        send_email(user_email, subject, html_content, plain_content)
        logger.info(f"Cancellation confirmation email sent to {user_email}")
        
    except Exception as e:
        logger.error(f"Failed to send cancellation confirmation email: {e}")

async def send_admin_notification_for_cancellation(user_name: str, user_email: str, event_title: str, event_date: str, event_time: str, cancellation_time: str):
    """Send notification to all admins when a user cancels a reservation"""
    try:
        # Get all admin users
        admin_users = list(db.users.find({"is_admin": True, "deleted": {"$ne": True}}))
        
        if not admin_users:
            logger.warning("No admin users found to send cancellation notification")
            return
        
        # Parse cancellation time for formatting
        from datetime import datetime
        cancel_datetime = datetime.fromisoformat(cancellation_time.replace('Z', '+00:00'))
        formatted_cancel_time = cancel_datetime.strftime("%d de %B, %Y a las %H:%M")
        
        subject = f"🚨 Cancelación de Reserva - {event_title}"
        
        for admin in admin_users:
            admin_name = admin.get("name", "Administrador")
            admin_email = admin.get("email")
            
            if not admin_email:
                continue
            
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0;">🚨 Notificación: Cancelación de Reserva</h1>
                    </div>
                    
                    <div style="background-color: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #f59e0b;">Hola {admin_name},</h2>
                        
                        <p style="font-size: 16px;">Te informamos que un usuario ha <strong>cancelado su reserva</strong> para el siguiente evento:</p>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #f59e0b;">📝 Detalles del Evento</h3>
                            <p style="margin: 5px 0;"><strong>Evento:</strong> {event_title}</p>
                            <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> {event_date}</p>
                            <p style="margin: 5px 0;"><strong>🕐 Hora:</strong> {event_time}</p>
                        </div>
                        
                        <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #6b7280;">👤 Datos del Usuario</h3>
                            <p style="margin: 5px 0;"><strong>Nombre:</strong> {user_name}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> {user_email}</p>
                            <p style="margin: 5px 0;"><strong>Cancelado el:</strong> {formatted_cancel_time}</p>
                        </div>
                        
                        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <p style="margin: 0; color: #1d4ed8;">
                                <strong>💡 Información:</strong> El lugar está ahora disponible para nuevas reservas.
                                Considera contactar al usuario si es necesario o revisar las métricas del evento.
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
                            Este es un mensaje automático del sistema de gestión.<br>
                            <strong>Centro Cultural Banreservas</strong>
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            plain_content = f"""
            Notificación: Cancelación de Reserva
            
            Hola {admin_name},
            
            Te informamos que un usuario ha cancelado su reserva para el siguiente evento:
            
            DETALLES DEL EVENTO:
            Evento: {event_title}
            Fecha: {event_date}
            Hora: {event_time}
            
            DATOS DEL USUARIO:
            Nombre: {user_name}
            Email: {user_email}
            Cancelado el: {formatted_cancel_time}
            
            El lugar está ahora disponible para nuevas reservas.
            Considera contactar al usuario si es necesario o revisar las métricas del evento.
            
            Este es un mensaje automático del sistema de gestión.
            Centro Cultural Banreservas
            """
            
            # Send email to admin
            send_email(admin_email, subject, html_content, plain_content)
            logger.info(f"Admin cancellation notification sent to {admin_email}")
        
    except Exception as e:
        logger.error(f"Failed to send admin cancellation notification: {e}")

# Routes
@app.get("/")
async def root():
    return {"message": "Cultural Center API is running"}

@app.post("/api/register")
@performance_tracker.track_endpoint_performance("user_registration")
async def register(user: UserCreate):
    try:
        # Check if user already exists
        existing_user = db.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = hash_password(user.password)
        
        # Combine nombre and apellido for full name
        full_name = f"{user.nombre} {user.apellido}".strip() if user.apellido else user.nombre
        
        user_doc = {
            "id": user_id,
            "name": full_name,
            "email": user.email,
            "password": hashed_password,
            "phone": user.telefono or "",
            "age": 0,  # Default age since not provided
            "location": "",  # Default location since not provided
            "cedula": user.cedula or "",
            "fecha_nacimiento": user.fecha_nacimiento or "",
            "ocupacion": user.ocupacion or "",
            "empresa": user.empresa or "",
            "is_admin": False,
            "bio": "",
            "avatar_url": "",
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.users.insert_one(user_doc)
        
        # Send welcome email
        send_welcome_email(user.email, full_name)
        
        # Track user registration event (disabled due to Redis connection issues)
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="user_registration",
                metadata={
                    "email": user.email,
                    "nombre": user.nombre,
                    "apellido": user.apellido or "",
                    "telefono": user.telefono or "",
                    "ocupacion": user.ocupacion or ""
                }
            )
        except Exception as e:
            # Log but don't fail the registration
            logger.warning(f"Analytics tracking failed for registration: {e}")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": User(
                id=user_id,
                name=full_name,
                email=user.email,
                phone=user.telefono or "",
                age=0,
                location="",
                is_admin=False,
                bio="",
                avatar_url="",
                created_at=user_doc["created_at"],
                updated_at=None
            )
        }
        
    except HTTPException as he:
        # Re-raise HTTP exceptions to preserve status codes
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
@performance_tracker.track_endpoint_performance("user_login")
async def login(user: UserLogin):
    try:
        # Find user
        user_doc = db.users.find_one({"email": user.email})
        if not user_doc:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not verify_password(user.password, user_doc["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Track user login event (disabled due to Redis connection issues)
        try:
            await analytics.track_user_event(
                user_id=user_doc["id"],
                event_type="user_login",
                metadata={
                    "email": user.email,
                    "login_time": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            # Log but don't fail the login
            logger.warning(f"Analytics tracking failed for login: {e}")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_doc["id"]}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": User(
                id=user_doc["id"],
                name=user_doc["name"],
                email=user_doc["email"],
                phone=user_doc["phone"],
                age=user_doc["age"],
                location=user_doc["location"],
                is_admin=user_doc.get("is_admin", False),
                bio=user_doc.get("bio"),
                avatar_url=user_doc.get("avatar_url"),
                created_at=user_doc.get("created_at", ""),
                updated_at=user_doc.get("updated_at")
            )
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/me")
async def get_current_user(user_id: str = Depends(verify_token)):
    """Get current user profile"""
    try:
        user = db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove MongoDB ObjectId and password
        if "_id" in user:
            del user["_id"]
        if "password" in user:
            del user["password"]
            
        return User(
            id=user["id"],
            name=user["name"],
            email=user["email"],
            phone=user["phone"],
            age=user["age"],
            location=user["location"],
            is_admin=user.get("is_admin", False),
            bio=user.get("bio"),
            avatar_url=user.get("avatar_url"),
            created_at=user.get("created_at", ""),
            updated_at=user.get("updated_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/profile")
async def update_user_profile(profile_update: UserProfileUpdate, user_id: str = Depends(verify_token)):
    """Update user profile"""
    try:
        # Check if user exists
        user = db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update document
        update_doc = {}
        if profile_update.name is not None:
            update_doc["name"] = profile_update.name
        if profile_update.phone is not None:
            update_doc["phone"] = profile_update.phone
        if profile_update.age is not None:
            update_doc["age"] = profile_update.age
        if profile_update.location is not None:
            update_doc["location"] = profile_update.location
        if profile_update.bio is not None:
            update_doc["bio"] = profile_update.bio
        if profile_update.avatar_url is not None:
            update_doc["avatar_url"] = profile_update.avatar_url
        
        # Add updated timestamp
        update_doc["updated_at"] = datetime.utcnow().isoformat()
        
        # Update user document
        result = db.users.update_one({"id": user_id}, {"$set": update_doc})
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get updated user
        updated_user = db.users.find_one({"id": user_id})
        
        # Remove MongoDB ObjectId and password
        if "_id" in updated_user:
            del updated_user["_id"]
        if "password" in updated_user:
            del updated_user["password"]
            
        return User(
            id=updated_user["id"],
            name=updated_user["name"],
            email=updated_user["email"],
            phone=updated_user["phone"],
            age=updated_user["age"],
            location=updated_user["location"],
            is_admin=updated_user.get("is_admin", False),
            bio=updated_user.get("bio"),
            avatar_url=updated_user.get("avatar_url"),
            created_at=updated_user.get("created_at", ""),
            updated_at=updated_user.get("updated_at")
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/reservations")
async def get_user_reservations(user_id: str = Depends(verify_token)):
    """Get user's reservations history"""
    try:
        # Get user reservations with event details
        reservations = list(db.reservations.find({"user_id": user_id}))
        
        # Enrich with event details
        enriched_reservations = []
        for reservation in reservations:
            # Get event details
            event = db.events.find_one({"id": reservation["event_id"]})
            
            # Remove MongoDB ObjectId
            if "_id" in reservation:
                del reservation["_id"]
            
            reservation_data = {
                "id": reservation["id"],
                "event_id": reservation["event_id"],
                "codigo_reserva": reservation.get("codigo_reserva", ""),
                "numero_asistentes": reservation.get("numero_asistentes", 1),
                "estado": reservation.get("estado", "confirmada"),
                "created_at": reservation.get("created_at", ""),
                "fecha_checkin": reservation.get("fecha_checkin"),
                "notes": reservation.get("notes"),
                "event": {
                    "id": event["id"] if event else None,
                    "title": event["title"] if event else "Evento eliminado",
                    "description": event["description"] if event else "",
                    "category": event["category"] if event else "",
                    "date": event["date"] if event else "",
                    "time": event["time"] if event else "",
                    "location": event["location"] if event else "",
                    "image_url": event.get("image_url") if event else None
                } if event else None
            }
            
            enriched_reservations.append(reservation_data)
        
        # Sort by creation date (newest first)
        enriched_reservations.sort(key=lambda x: x["created_at"], reverse=True)
        
        return {
            "reservations": enriched_reservations,
            "total": len(enriched_reservations)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/profile/stats")
async def get_user_stats(user_id: str = Depends(verify_token)):
    """Get user statistics"""
    try:
        # Get user reservations count
        total_reservations = db.reservations.count_documents({"user_id": user_id})
        
        # Get attended events count
        attended_events = db.reservations.count_documents({
            "user_id": user_id,
            "estado": "checked_in"
        })
        
        # Get upcoming events count
        upcoming_reservations = db.reservations.count_documents({
            "user_id": user_id,
            "estado": "confirmed"
        })
        
        # Get canceled reservations count
        canceled_reservations = db.reservations.count_documents({
            "user_id": user_id,
            "estado": "cancelled"
        })
        
        # Calculate attendance rate
        attendance_rate = 0
        if total_reservations > 0:
            attendance_rate = round((attended_events / total_reservations) * 100, 1)
        
        # Get favorite categories
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$lookup": {
                "from": "events",
                "localField": "event_id",
                "foreignField": "id",
                "as": "event"
            }},
            {"$unwind": "$event"},
            {"$group": {
                "_id": "$event.category",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 3}
        ]
        
        favorite_categories = list(db.reservations.aggregate(pipeline))
        
        return {
            "total_reservations": total_reservations,
            "attended_events": attended_events,
            "upcoming_reservations": upcoming_reservations,
            "canceled_reservations": canceled_reservations,
            "attendance_rate": attendance_rate,
            "favorite_categories": [cat["_id"] for cat in favorite_categories]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events")
@performance_tracker.track_endpoint_performance("get_events")
async def get_events():
    try:
        events = list(db.events.find({}))
        event_list = []
        
        for event in events:
            # Remove MongoDB ObjectId
            if "_id" in event:
                del event["_id"]
                
            # Calculate available spots
            reservations = db.reservations.count_documents({
                "event_id": event["id"],
                "status": {"$in": ["confirmed", "checked_in"]}
            })
            available_spots = event["capacity"] - reservations
            
            event_list.append(Event(
                id=event["id"],
                title=event["title"],
                description=event["description"],
                category=event["category"],
                date=event["date"],
                time=event["time"],
                capacity=event["capacity"],
                location=event["location"],
                image_url=event.get("image_url"),
                available_spots=available_spots,
                created_at=event["created_at"]
            ))
        
        return event_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/events/{event_id}")
@performance_tracker.track_endpoint_performance("get_event_by_id")
async def get_event_by_id(event_id: str):
    try:
        # Find the event by ID
        event = db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Remove MongoDB ObjectId
        if "_id" in event:
            del event["_id"]
            
        # Calculate available spots
        reservations = db.reservations.count_documents({
            "event_id": event["id"],
            "status": {"$in": ["confirmed", "checked_in"]}
        })
        available_spots = event["capacity"] - reservations
        
        return Event(
            id=event["id"],
            title=event["title"],
            description=event["description"],
            category=event["category"],
            date=event["date"],
            time=event["time"],
            capacity=event["capacity"],
            location=event["location"],
            image_url=event.get("image_url"),
            available_spots=available_spots,
            created_at=event["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/events")
async def create_event(event: EventCreate, user_id: str = Depends(verify_token)):
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate category
        if event.category not in EVENT_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid event category")
        
        # Create event
        event_id = str(uuid.uuid4())
        event_doc = {
            "id": event_id,
            "title": event.title,
            "description": event.description,
            "category": event.category,
            "date": event.date,
            "time": event.time,
            "capacity": event.capacity,
            "location": event.location,
            "image_url": event.image_url,
            "price": event.price,
            "tags": event.tags,
            "requirements": event.requirements,
            "contact_info": event.contact_info,
            "published": event.published,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.events.insert_one(event_doc)
        
        return Event(
            id=event_id,
            title=event.title,
            description=event.description,
            category=event.category,
            date=event.date,
            time=event.time,
            capacity=event.capacity,
            location=event.location,
            image_url=event.image_url,
            price=event.price,
            tags=event.tags,
            requirements=event.requirements,
            contact_info=event.contact_info,
            published=event.published,
            available_spots=event.capacity,
            created_at=event_doc["created_at"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/events/{event_id}")
@performance_tracker.track_endpoint_performance("update_event")
async def update_event(event_id: str, event_update: EventCreate, user_id: str = Depends(verify_token)):
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if event exists
        existing_event = db.events.find_one({"id": event_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Validate category
        if event_update.category not in EVENT_CATEGORIES:
            raise HTTPException(status_code=400, detail="Invalid event category")
        
        # Update event document
        update_doc = {
            "title": event_update.title,
            "description": event_update.description,
            "category": event_update.category,
            "date": event_update.date,
            "time": event_update.time,
            "capacity": event_update.capacity,
            "location": event_update.location,
            "image_url": event_update.image_url,
            "price": event_update.price,
            "tags": event_update.tags,
            "requirements": event_update.requirements,
            "contact_info": event_update.contact_info,
            "published": event_update.published,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        db.events.update_one({"id": event_id}, {"$set": update_doc})
        
        # Calculate available spots for response
        reservations = db.reservations.count_documents({
            "event_id": event_id,
            "status": {"$in": ["confirmed", "checked_in"]}
        })
        available_spots = event_update.capacity - reservations
        
        return Event(
            id=event_id,
            title=event_update.title,
            description=event_update.description,
            category=event_update.category,
            date=event_update.date,
            time=event_update.time,
            capacity=event_update.capacity,
            location=event_update.location,
            image_url=event_update.image_url,
            price=event_update.price,
            tags=event_update.tags,
            requirements=event_update.requirements,
            contact_info=event_update.contact_info,
            published=event_update.published,
            available_spots=available_spots,
            created_at=existing_event["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/events/{event_id}")
@performance_tracker.track_endpoint_performance("delete_event")
async def delete_event(event_id: str, user_id: str = Depends(verify_token)):
    """Delete an event (Admin only)"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if event exists
        existing_event = db.events.find_one({"id": event_id})
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if event has active reservations
        active_reservations = db.reservations.count_documents({
            "event_id": event_id,
            "status": {"$in": ["confirmed", "checked_in"]}
        })
        
        if active_reservations > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete event with {active_reservations} active reservations. Cancel reservations first."
            )
        
        # Delete the event
        result = db.events.delete_one({"id": event_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete event")
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="event_deleted",
                metadata={
                    "event_id": event_id,
                    "event_title": existing_event.get("title", "Unknown"),
                    "event_category": existing_event.get("category", "Unknown")
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {"message": "Event deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete event: {str(e)}")

@app.post("/api/reservations")
@performance_tracker.track_endpoint_performance("create_reservation")
async def create_reservation(reservation: ReservationCreate, user_id: str = Depends(verify_token)):
    try:
        # Check if event exists
        event = db.events.find_one({"id": reservation.event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get user details for email
        user = db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user already has a reservation for this event
        existing_reservation = db.reservations.find_one({
            "event_id": reservation.event_id,
            "user_id": user_id,
            "status": {"$in": ["confirmed", "checked_in"]}
        })
        if existing_reservation:
            raise HTTPException(status_code=400, detail="You already have a reservation for this event")
        
        # Check capacity
        reservations_count = db.reservations.count_documents({
            "event_id": reservation.event_id,
            "status": {"$in": ["confirmed", "checked_in"]}
        })
        
        if reservations_count >= event["capacity"]:
            raise HTTPException(status_code=400, detail="Event is fully booked")
        
        # Create reservation
        reservation_id = str(uuid.uuid4())
        
        # Generate unique check-in code
        checkin_code = generate_checkin_code()
        # Ensure uniqueness by checking database
        while db.reservations.find_one({"checkin_code": checkin_code}):
            checkin_code = generate_checkin_code()
        
        # Código QR deshabilitado - se usa solo código de reserva
        # qr_data = f"https://ccb.checkin.app/verify/{reservation_id}"
        # qr_code = generate_qr_code(qr_data)
        qr_code = None  # No se genera QR para nuevas reservas
        
        reservation_doc = {
            "id": reservation_id,
            "event_id": reservation.event_id,
            "user_id": user_id,
            "status": "confirmed",
            "qr_code": qr_code,
            "checkin_code": checkin_code,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.reservations.insert_one(reservation_doc)
        
        # Track event booking
        await analytics.track_user_event(
            user_id=user_id,
            event_type="event_booking",
            metadata={
                "event_id": reservation.event_id,
                "event_title": event["title"],
                "event_category": event["category"],
                "reservation_id": reservation_id
            }
        )
        
        # Track business metric
        await analytics.track_business_metric(
            metric_name="booking_created",
            value=1,
            tags={"event_category": event["category"]}
        )
        
        # Send confirmation email
        send_reservation_confirmation_email(
            user["email"],
            user["name"],
            event["title"],
            event["date"],
            event["time"],
            event["location"],
            qr_code,
            checkin_code
        )
        
        return Reservation(
            id=reservation_id,
            event_id=reservation.event_id,
            user_id=user_id,
            status="confirmed",
            qr_code=qr_code,
            checkin_code=checkin_code,
            created_at=reservation_doc["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reservations")
async def get_user_reservations(user_id: str = Depends(verify_token)):
    try:
        reservations = list(db.reservations.find({"user_id": user_id}))
        reservation_list = []
        
        for reservation in reservations:
            # Get event details
            event = db.events.find_one({"id": reservation["event_id"]})
            if event:
                # Convert MongoDB ObjectId to string if present
                if "_id" in event:
                    del event["_id"]
                if "_id" in reservation:
                    del reservation["_id"]
                
                reservation_data = Reservation(
                    id=reservation["id"],
                    event_id=reservation["event_id"],
                    user_id=reservation["user_id"],
                    status=reservation["status"],
                    qr_code=reservation["qr_code"],
                    checkin_code=reservation.get("checkin_code", ""),
                    created_at=reservation["created_at"]
                )
                reservation_list.append({
                    "reservation": reservation_data,
                    "event": event
                })
        
        return reservation_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/checkin")
async def checkin_user(request: dict):
    """
    Check-in using multiple identification methods:
    - QR code data (reservation:id)
    - Check-in code (8-character code)
    - Email address
    - Phone number
    """
    try:
        identifier = request.get("identifier", "").strip()
        if not identifier:
            raise HTTPException(status_code=400, detail="Identifier is required")
        
        reservation = None
        
        # Method 1: QR code data - formato URL nuevo
        if identifier.startswith("https://ccb.checkin.app/verify/"):
            reservation_id = identifier.replace("https://ccb.checkin.app/verify/", "")
            reservation = db.reservations.find_one({"id": reservation_id})
        
        # Method 1b: QR code data - formato anterior (backward compatibility)
        elif identifier.startswith("reservation:"):
            reservation_id = identifier.replace("reservation:", "")
            reservation = db.reservations.find_one({"id": reservation_id})
        
        # Method 2: Check-in code (8-character alphanumeric)
        elif len(identifier) == 8 and identifier.replace("-", "").isalnum():
            reservation = db.reservations.find_one({"checkin_code": identifier.upper()})
        
        # Method 3: Email address
        elif "@" in identifier:
            user = db.users.find_one({"email": identifier.lower()})
            if user:
                # Find the most recent confirmed reservation for this user
                reservation = db.reservations.find_one(
                    {"user_id": user["id"], "status": "confirmed"},
                    sort=[("created_at", -1)]
                )
        
        # Method 4: Phone number
        else:
            # Clean phone number (remove spaces, dashes, etc.)
            clean_phone = ''.join(filter(str.isdigit, identifier))
            user = db.users.find_one({
                "$or": [
                    {"phone": identifier},
                    {"phone": clean_phone},
                    {"phone": f"+1{clean_phone}"},
                    {"phone": f"+1-{clean_phone[:3]}-{clean_phone[3:6]}-{clean_phone[6:]}"}
                ]
            })
            if user:
                # Find the most recent confirmed reservation for this user
                reservation = db.reservations.find_one(
                    {"user_id": user["id"], "status": "confirmed"},
                    sort=[("created_at", -1)]
                )
        
        if not reservation:
            raise HTTPException(status_code=404, detail="No valid reservation found for this identifier")
        
        if reservation["status"] == "checked_in":
            raise HTTPException(status_code=400, detail="Already checked in")
        
        if reservation["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Cannot check in to a cancelled reservation")
        
        # Get user and event details for email
        user = db.users.find_one({"id": reservation["user_id"]})
        event = db.events.find_one({"id": reservation["event_id"]})
        
        # Update reservation status
        db.reservations.update_one(
            {"id": reservation["id"]},
            {"$set": {"status": "checked_in", "checked_in_at": datetime.utcnow().isoformat()}}
        )
        
        # Send check-in confirmation email
        if user and event:
            send_checkin_confirmation_email(
                user["email"],
                user["name"],
                event["title"]
            )
        
        # Track check-in analytics
        await analytics.track_user_event(
            user_id=user["id"],
            event_type="event_checkin",
            metadata={
                "event_id": event["id"],
                "event_title": event["title"],
                "reservation_id": reservation["id"],
                "checkin_method": "qr_code" if identifier.startswith("reservation:") 
                                else "checkin_code" if len(identifier) == 8 
                                else "email" if "@" in identifier 
                                else "phone"
            }
        )
        
        return {
            "message": "Successfully checked in",
            "reservation_id": reservation["id"],
            "user_name": user["name"],
            "event_title": event["title"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Mantener el endpoint anterior para compatibilidad
@app.post("/api/checkin/{reservation_id}")
async def checkin_reservation(reservation_id: str):
    try:
        return await checkin_user({"identifier": f"reservation:{reservation_id}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/reservations/{reservation_id}")
async def cancel_reservation(reservation_id: str, user_id: str = Depends(verify_token)):
    """Cancel a reservation"""
    try:
        # Debug logging
        print(f"🔍 DEBUG: Attempting to cancel reservation ID: {reservation_id}")
        print(f"🔍 DEBUG: User ID: {user_id}")
        
        # Find reservation
        reservation = db.reservations.find_one({"id": reservation_id})
        print(f"🔍 DEBUG: Found reservation: {reservation}")
        
        if not reservation:
            print(f"❌ DEBUG: Reservation not found in database")
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        # Check if user owns this reservation or is admin
        user_doc = db.users.find_one({"id": user_id})
        print(f"🔍 DEBUG: User doc: {user_doc}")
        
        if reservation["user_id"] != user_id and not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Not authorized to cancel this reservation")
        
        # Check if reservation can be cancelled
        if reservation["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Reservation is already cancelled")
        
        if reservation["status"] == "checked_in":
            raise HTTPException(status_code=400, detail="Cannot cancel a reservation that has already been checked in")
        
        # Get user and event details for notifications
        user = db.users.find_one({"id": reservation["user_id"]})
        event = db.events.find_one({"id": reservation["event_id"]})
        
        # Update reservation status
        cancellation_time = datetime.utcnow().isoformat()
        update_result = db.reservations.update_one(
            {"id": reservation_id},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": cancellation_time,
                "cancelled_by": user_id
            }}
        )
        
        if update_result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to cancel reservation")
        
        # Track cancellation analytics
        await analytics.track_user_event(
            user_id=user_id,
            event_type="reservation_cancelled",
            metadata={
                "reservation_id": reservation_id,
                "event_id": reservation["event_id"],
                "event_title": event["title"] if event else "Unknown",
                "event_category": event["category"] if event else "Unknown",
                "cancelled_by_owner": reservation["user_id"] == user_id
            }
        )
        
        # Track business metric
        await analytics.track_business_metric(
            metric_name="reservation_cancelled",
            value=1,
            tags={"event_category": event["category"] if event else "unknown"}
        )
        
        # Send cancellation notification email to user
        if user and event:
            send_reservation_cancellation_email(
                user["email"],
                user["name"],
                event["title"],
                event["date"],
                event["time"],
                event["location"],
                cancellation_time
            )
        
        # Send notification to admins if cancelled by user
        if reservation["user_id"] == user_id:
            await send_admin_notification_for_cancellation(
                user_name=user["name"] if user else "Unknown User",
                user_email=user["email"] if user else "unknown@email.com",
                event_title=event["title"] if event else "Unknown Event",
                event_date=event["date"] if event else "Unknown Date",
                event_time=event["time"] if event else "Unknown Time",
                cancellation_time=cancellation_time
            )
        
        return {
            "message": "Reservation cancelled successfully",
            "reservation_id": reservation_id,
            "cancelled_at": cancellation_time
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DEBUG: Exception in cancel_reservation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/categories")
async def get_categories():
    # Return Spanish categories that frontend expects
    spanish_categories = [
        "Cinema Dominicano",
        "Cine Clásico", 
        "Cine General",
        "Talleres",
        "Conciertos",
        "Charlas/Conferencias",
        "Exposiciones de Arte",
        "Experiencias 3D Inmersivas"
    ]
    return spanish_categories

@app.get("/api/events/categories/list")
async def get_event_categories_list():
    # Alternative endpoint for categories
    spanish_categories = [
        "Cinema Dominicano",
        "Cine Clásico", 
        "Cine General",
        "Talleres",
        "Conciertos",
        "Charlas/Conferencias",
        "Exposiciones de Arte",
        "Experiencias 3D Inmersivas"
    ]
    return {"categories": spanish_categories}

@app.post("/api/create-admin")
async def create_admin():
    """Create an admin user for testing purposes"""
    try:
        # Check if admin already exists
        existing_admin = db.users.find_one({"email": "admin@culturalcenter.com"})
        if existing_admin:
            return {"message": "Admin user already exists"}
        
        # Create admin user
        admin_id = str(uuid.uuid4())
        hashed_password = hash_password("admin123")
        
        admin_doc = {
            "id": admin_id,
            "name": "Admin User",
            "email": "admin@culturalcenter.com",
            "password": hashed_password,
            "phone": "1234567890",
            "age": 30,
            "location": "Cultural Center",
            "is_admin": True,
            "created_at": datetime.utcnow().isoformat()
        }
        
        db.users.insert_one(admin_doc)
        
        return {"message": "Admin user created successfully", "email": "admin@culturalcenter.com", "password": "admin123"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/seed-data")
async def seed_data():
    """Create sample events for testing"""
    try:
        # Check if events already exist
        existing_events = db.events.count_documents({})
        if existing_events > 0:
            return {"message": f"Database already has {existing_events} events"}
        
        # Sample events
        sample_events = [
            {
                "id": str(uuid.uuid4()),
                "title": "Dominican Cinema Night",
                "description": "Experience the best of Dominican cinema with award-winning films showcasing local talent and stories.",
                "category": "Dominican Cinema",
                "date": "2025-03-25",
                "time": "19:00",
                "capacity": 50,
                "location": "Main Theater",
                "image_url": "https://images.unsplash.com/photo-1489599904919-c78a3c35c467?w=400",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Classical Music Workshop",
                "description": "Learn about classical music composition and appreciation with renowned musicians.",
                "category": "Workshops",
                "date": "2025-03-26",
                "time": "14:00",
                "capacity": 30,
                "location": "Music Room",
                "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Jazz Concert",
                "description": "An evening of smooth jazz featuring local and international artists.",
                "category": "Concerts",
                "date": "2025-03-27",
                "time": "20:00",
                "capacity": 100,
                "location": "Concert Hall",
                "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Modern Art Exhibition",
                "description": "Explore contemporary art from emerging Dominican artists.",
                "category": "Art Exhibitions",
                "date": "2025-03-28",
                "time": "10:00",
                "capacity": 75,
                "location": "Gallery Space",
                "image_url": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "3D Virtual Reality Experience",
                "description": "Immerse yourself in cutting-edge 3D technology and virtual worlds.",
                "category": "3D Immersive Experiences",
                "date": "2025-03-29",
                "time": "16:00",
                "capacity": 20,
                "location": "3D Room",
                "image_url": "https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=400",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        # Insert events
        db.events.insert_many(sample_events)
        
        return {"message": f"Created {len(sample_events)} sample events"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/stats")
async def get_admin_stats(user_id: str = Depends(verify_token)):
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get statistics
        total_events = db.events.count_documents({})
        total_reservations = db.reservations.count_documents({})
        total_checkins = db.reservations.count_documents({"status": "checked_in"})
        total_users = db.users.count_documents({"deleted": {"$ne": True}})
        
        return {
            "total_events": total_events,
            "total_reservations": total_reservations,
            "total_checkins": total_checkins,
            "total_users": total_users
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users")
async def get_all_users(
    skip: int = 0, 
    limit: int = 50,
    search: str = None,
    status_filter: str = None,  # "active", "inactive", "admin", "deleted", "all"
    location_filter: str = None,
    age_min: int = None,
    age_max: int = None,
    sort_by: str = "created_at",  # "name", "email", "created_at", "last_activity"
    sort_order: str = "desc",  # "asc", "desc"
    user_id: str = Depends(verify_token)
):
    """Get all users with pagination and search"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Build search query
        query = {}
        
        # Exclude deleted users by default (unless specifically requested)
        if status_filter != "deleted" and status_filter != "all":
            query["deleted"] = {"$ne": True}
        
        # Text search
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"location": {"$regex": search, "$options": "i"}}
            ]
        
        # Status filters
        if status_filter == "admin":
            query["is_admin"] = True
        elif status_filter == "deleted":
            query["deleted"] = True
        
        # Location filter
        if location_filter:
            query["location"] = {"$regex": location_filter, "$options": "i"}
        
        # Age filters
        if age_min is not None or age_max is not None:
            age_query = {}
            if age_min is not None:
                age_query["$gte"] = age_min
            if age_max is not None:
                age_query["$lte"] = age_max
            query["age"] = age_query
        
        # Determine sort direction
        sort_direction = 1 if sort_order == "asc" else -1
        
        # Get users with pagination and sorting
        users_cursor = db.users.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        users = list(users_cursor)
        
        # Get total count
        total_users = db.users.count_documents(query)
        
        # Enhance user data with statistics
        enhanced_users = []
        for user in users:
            if "_id" in user:
                del user["_id"]
            if "password" in user:
                del user["password"]
            
            # Calculate user statistics
            total_reservations = db.reservations.count_documents({"user_id": user["id"]})
            attended_events = db.reservations.count_documents({
                "user_id": user["id"], 
                "status": "checked_in"
            })
            
            # Calculate attendance rate
            attendance_rate = (attended_events / total_reservations * 100) if total_reservations > 0 else 0
            
            # Get last activity (most recent reservation)
            last_reservation = db.reservations.find_one(
                {"user_id": user["id"]}, 
                sort=[("created_at", -1)]
            )
            last_activity = last_reservation["created_at"] if last_reservation else user.get("created_at")
            
            # Determine user status
            if user.get("deleted"):
                status = "deleted"
            elif user.get("is_admin"):
                status = "admin"
            elif total_reservations > 0:
                status = "active"
            else:
                status = "inactive"
            
            enhanced_user = {
                **user,
                "total_reservations": total_reservations,
                "attended_events": attended_events,
                "attendance_rate": round(attendance_rate, 1),
                "last_activity": last_activity,
                "status": status
            }
            enhanced_users.append(enhanced_user)
        
        return {
            "users": enhanced_users,
            "total": total_users,
            "page": skip // limit + 1,
            "pages": (total_users + limit - 1) // limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users/{target_user_id}")
async def get_user_profile(target_user_id: str, user_id: str = Depends(verify_token)):
    """Get detailed profile for a specific user"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get user
        target_user = db.users.find_one({"id": target_user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Remove sensitive data
        if "_id" in target_user:
            del target_user["_id"]
        if "password" in target_user:
            del target_user["password"]
        
        # Get user's reservations with event details
        reservations = list(db.reservations.find({"user_id": target_user_id}).sort("created_at", -1))
        
        enhanced_reservations = []
        for reservation in reservations:
            if "_id" in reservation:
                del reservation["_id"]
            
            # Get event details
            event = db.events.find_one({"id": reservation["event_id"]})
            if event:
                if "_id" in event:
                    del event["_id"]
                reservation["event_details"] = {
                    "title": event["title"],
                    "category": event["category"],
                    "date": event["date"],
                    "time": event["time"],
                    "location": event["location"]
                }
            
            enhanced_reservations.append(reservation)
        
        # Calculate detailed statistics
        total_reservations = len(enhanced_reservations)
        attended_events = len([r for r in enhanced_reservations if r["status"] == "checked_in"])
        cancelled_events = len([r for r in enhanced_reservations if r["status"] == "cancelled"])
        upcoming_events = len([r for r in enhanced_reservations if r["status"] == "confirmed"])
        
        # Calculate category preferences
        categories = {}
        for reservation in enhanced_reservations:
            if "event_details" in reservation:
                category = reservation["event_details"]["category"]
                categories[category] = categories.get(category, 0) + 1
        
        # Most preferred category
        favorite_category = max(categories.items(), key=lambda x: x[1])[0] if categories else None
        
        profile = {
            **target_user,
            "reservations": enhanced_reservations,
            "statistics": {
                "total_reservations": total_reservations,
                "attended_events": attended_events,
                "cancelled_events": cancelled_events,
                "upcoming_events": upcoming_events,
                "attendance_rate": round((attended_events / total_reservations * 100) if total_reservations > 0 else 0, 1),
                "favorite_category": favorite_category,
                "category_breakdown": categories
            }
        }
        
        return profile
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/users-metrics")
async def get_users_metrics(user_id: str = Depends(verify_token)):
    """Get general metrics about users"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get basic counts (excluding deleted users)
        total_users = db.users.count_documents({"deleted": {"$ne": True}})
        admin_users = db.users.count_documents({"is_admin": True, "deleted": {"$ne": True}})
        deleted_users = db.users.count_documents({"deleted": True})
        
        # Get registrations in last 30 days (excluding deleted users)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        recent_registrations = db.users.count_documents({
            "created_at": {"$gte": thirty_days_ago},
            "deleted": {"$ne": True}
        })
        
        # Get active users (with at least one reservation, excluding deleted users)
        active_users = len(list(db.users.aggregate([
            {
                "$match": {
                    "deleted": {"$ne": True}
                }
            },
            {
                "$lookup": {
                    "from": "reservations",
                    "localField": "id",
                    "foreignField": "user_id",
                    "as": "reservations"
                }
            },
            {
                "$match": {
                    "reservations": {"$ne": []}
                }
            }
        ])))
        
        # Age distribution (excluding deleted users)
        age_groups = {
            "18-25": 0,
            "26-35": 0,
            "36-50": 0,
            "51+": 0
        }
        
        users_with_age = list(db.users.find({
            "age": {"$exists": True}, 
            "deleted": {"$ne": True}
        }, {"age": 1}))
        for user in users_with_age:
            age = user.get("age", 0)
            if 18 <= age <= 25:
                age_groups["18-25"] += 1
            elif 26 <= age <= 35:
                age_groups["26-35"] += 1
            elif 36 <= age <= 50:
                age_groups["36-50"] += 1
            elif age > 50:
                age_groups["51+"] += 1
        
        # Location distribution (top 5, excluding deleted users)
        location_pipeline = [
            {"$match": {"deleted": {"$ne": True}}},
            {"$group": {"_id": "$location", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_locations = list(db.users.aggregate(location_pipeline))
        location_distribution = {loc["_id"]: loc["count"] for loc in top_locations}
        
        return {
            "total_users": total_users,
            "admin_users": admin_users,
            "active_users": active_users,
            "inactive_users": total_users - active_users,
            "deleted_users": deleted_users,
            "recent_registrations": recent_registrations,
            "age_distribution": age_groups,
            "location_distribution": location_distribution,
            "activity_rate": round((active_users / total_users * 100) if total_users > 0 else 0, 1)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/admin/users/{target_user_id}")
async def update_user(target_user_id: str, user_update: UserUpdate, user_id: str = Depends(verify_token)):
    """Update a specific user"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if target user exists
        target_user = db.users.find_one({"id": target_user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare update data (only include fields that were provided)
        update_data = {}
        if user_update.name is not None:
            update_data["name"] = user_update.name
        if user_update.email is not None:
            # Check if email is already taken by another user
            existing_email = db.users.find_one({"email": user_update.email, "id": {"$ne": target_user_id}})
            if existing_email:
                raise HTTPException(status_code=400, detail="Email already exists")
            update_data["email"] = user_update.email
        if user_update.phone is not None:
            update_data["phone"] = user_update.phone
        if user_update.age is not None:
            if user_update.age < 1 or user_update.age > 120:
                raise HTTPException(status_code=400, detail="Age must be between 1 and 120")
            update_data["age"] = user_update.age
        if user_update.location is not None:
            update_data["location"] = user_update.location
        if user_update.is_admin is not None:
            update_data["is_admin"] = user_update.is_admin
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No valid fields to update")
        
        # Add update timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update user
        result = db.users.update_one(
            {"id": target_user_id},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="No changes made")
        
        # Get updated user
        updated_user = db.users.find_one({"id": target_user_id})
        if "_id" in updated_user:
            del updated_user["_id"]
        if "password" in updated_user:
            del updated_user["password"]
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="user_updated",
                metadata={
                    "target_user_id": target_user_id,
                    "updated_fields": list(update_data.keys())
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {"message": "User updated successfully", "user": updated_user}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/users/{target_user_id}")
async def delete_user(target_user_id: str, user_id: str = Depends(verify_token)):
    """Delete a specific user"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Check if target user exists
        target_user = db.users.find_one({"id": target_user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prevent admin from deleting themselves
        if target_user_id == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        # Check if user has reservations
        user_reservations = db.reservations.count_documents({"user_id": target_user_id})
        if user_reservations > 0:
            # Option 1: Soft delete (mark as deleted but keep data)
            # Option 2: Hard delete with cascade (remove user and reservations)
            # For now, we'll do soft delete
            
            result = db.users.update_one(
                {"id": target_user_id},
                {"$set": {
                    "deleted": True,
                    "deleted_at": datetime.utcnow().isoformat(),
                    "deleted_by": user_id
                }}
            )
            
            message = f"User marked as deleted (had {user_reservations} reservations)"
        else:
            # Hard delete if no reservations
            result = db.users.delete_one({"id": target_user_id})
            message = "User deleted permanently"
        
        if result.modified_count == 0 and result.deleted_count == 0:
            raise HTTPException(status_code=400, detail="Failed to delete user")
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="user_deleted",
                metadata={
                    "target_user_id": target_user_id,
                    "had_reservations": user_reservations > 0,
                    "soft_delete": user_reservations > 0
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {"message": message}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users/bulk-action")
async def bulk_user_action(action_data: BulkUserAction, user_id: str = Depends(verify_token)):
    """Perform bulk actions on multiple users"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        if not action_data.user_ids:
            raise HTTPException(status_code=400, detail="No users selected")
        
        # Prevent admin from affecting their own account in bulk operations
        if user_id in action_data.user_ids:
            action_data.user_ids.remove(user_id)
            if not action_data.user_ids:
                raise HTTPException(status_code=400, detail="Cannot perform bulk action on your own account only")
        
        # Count affected users
        affected_count = 0
        errors = []
        
        if action_data.action == "delete":
            # Soft delete users with reservations, hard delete others
            for target_user_id in action_data.user_ids:
                try:
                    user_reservations = db.reservations.count_documents({"user_id": target_user_id})
                    if user_reservations > 0:
                        # Soft delete
                        result = db.users.update_one(
                            {"id": target_user_id, "deleted": {"$ne": True}},
                            {"$set": {
                                "deleted": True,
                                "deleted_at": datetime.utcnow().isoformat(),
                                "deleted_by": user_id
                            }}
                        )
                        if result.modified_count > 0:
                            affected_count += 1
                    else:
                        # Hard delete
                        result = db.users.delete_one({"id": target_user_id})
                        if result.deleted_count > 0:
                            affected_count += 1
                except Exception as e:
                    errors.append(f"User {target_user_id}: {str(e)}")
        
        elif action_data.action == "make_admin":
            result = db.users.update_many(
                {"id": {"$in": action_data.user_ids}},
                {"$set": {"is_admin": True, "updated_at": datetime.utcnow().isoformat()}}
            )
            affected_count = result.modified_count
        
        elif action_data.action == "remove_admin":
            result = db.users.update_many(
                {"id": {"$in": action_data.user_ids}},
                {"$set": {"is_admin": False, "updated_at": datetime.utcnow().isoformat()}}
            )
            affected_count = result.modified_count
        
        elif action_data.action == "activate":
            result = db.users.update_many(
                {"id": {"$in": action_data.user_ids}},
                {"$unset": {"deleted": "", "deleted_at": "", "deleted_by": ""}, 
                 "$set": {"updated_at": datetime.utcnow().isoformat()}}
            )
            affected_count = result.modified_count
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="bulk_user_action",
                metadata={
                    "action": action_data.action,
                    "user_count": len(action_data.user_ids),
                    "affected_count": affected_count,
                    "errors": len(errors)
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {
            "message": f"Bulk {action_data.action} completed",
            "affected_count": affected_count,
            "total_requested": len(action_data.user_ids),
            "errors": errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk action: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/users/bulk-import")
async def bulk_import_users(
    file: UploadFile = File(...),
    default_password: str = "changeme123",
    user_id: str = Depends(verify_token)
):
    """Import multiple users from CSV/Excel file"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read file content
        content = await file.read()
        
        # Parse file based on type
        users_data = []
        if file.filename.endswith('.csv'):
            # Parse CSV
            content_str = content.decode('utf-8')
            csv_file = io.StringIO(content_str)
            reader = csv.DictReader(csv_file)
            users_data = list(reader)
        else:
            # Parse Excel
            df = pd.read_excel(io.BytesIO(content))
            users_data = df.to_dict('records')
        
        # Initialize result tracking
        result = {
            "total_processed": len(users_data),
            "successful_imports": 0,
            "failed_imports": 0,
            "duplicate_emails": 0,
            "errors": [],
            "imported_users": []
        }
        
        # Required columns mapping (flexible column names)
        column_mapping = {
            'name': ['name', 'nombre', 'full_name', 'fullname', 'full name'],
            'email': ['email', 'correo', 'mail', 'e-mail'],
            'phone': ['phone', 'telefono', 'tel', 'telephone', 'cellphone', 'celular'],
            'age': ['age', 'edad', 'years', 'años'],
            'location': ['location', 'ubicacion', 'city', 'ciudad', 'address', 'direccion']
        }
        
        def find_column(data_row, possible_names):
            """Find the actual column name from possible variations"""
            for key in data_row.keys():
                if key.lower().strip() in possible_names:
                    return key
            return None
        
        # Process each user
        for idx, row in enumerate(users_data, 1):
            try:
                # Map columns to standard names
                mapped_user = {}
                missing_fields = []
                
                for field, possible_names in column_mapping.items():
                    column_name = find_column(row, possible_names)
                    if column_name and row[column_name] and str(row[column_name]).strip():
                        mapped_user[field] = str(row[column_name]).strip()
                    else:
                        missing_fields.append(field)
                
                # Check for required fields
                if missing_fields:
                    result["errors"].append({
                        "row": idx,
                        "error": f"Missing required fields: {', '.join(missing_fields)}",
                        "data": dict(row)
                    })
                    result["failed_imports"] += 1
                    continue
                
                # Validate email format
                try:
                    # Allow example.com for testing purposes
                    validate_email(mapped_user['email'], check_deliverability=False)
                except EmailNotValidError:
                    result["errors"].append({
                        "row": idx,
                        "error": "Invalid email format",
                        "data": dict(row)
                    })
                    result["failed_imports"] += 1
                    continue
                
                # Check if email already exists
                existing_user = db.users.find_one({"email": mapped_user['email']})
                if existing_user:
                    result["duplicate_emails"] += 1
                    result["errors"].append({
                        "row": idx,
                        "error": "Email already exists",
                        "data": dict(row)
                    })
                    continue
                
                # Validate age
                try:
                    age = int(float(mapped_user['age']))
                    if age < 1 or age > 120:
                        raise ValueError("Age out of range")
                    mapped_user['age'] = age
                except ValueError:
                    result["errors"].append({
                        "row": idx,
                        "error": "Invalid age (must be a number between 1-120)",
                        "data": dict(row)
                    })
                    result["failed_imports"] += 1
                    continue
                
                # Create user document
                user_id_new = str(uuid.uuid4())
                hashed_password = hash_password(default_password)
                
                user_doc = {
                    "id": user_id_new,
                    "name": mapped_user['name'],
                    "email": mapped_user['email'],
                    "password": hashed_password,
                    "phone": mapped_user['phone'],
                    "age": mapped_user['age'],
                    "location": mapped_user['location'],
                    "is_admin": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "imported": True,
                    "import_date": datetime.utcnow().isoformat()
                }
                
                # Insert user
                db.users.insert_one(user_doc)
                
                # Add to successful imports
                result["successful_imports"] += 1
                result["imported_users"].append({
                    "name": mapped_user['name'],
                    "email": mapped_user['email'],
                    "phone": mapped_user['phone'],
                    "age": mapped_user['age'],
                    "location": mapped_user['location']
                })
                
                # Send welcome email (optional)
                try:
                    send_welcome_email(mapped_user['email'], mapped_user['name'])
                except Exception as email_error:
                    logger.warning(f"Failed to send welcome email to {mapped_user['email']}: {email_error}")
                
            except Exception as row_error:
                result["errors"].append({
                    "row": idx,
                    "error": str(row_error),
                    "data": dict(row)
                })
                result["failed_imports"] += 1
        
        # Track analytics event
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="bulk_import_users",
                metadata={
                    "total_processed": result["total_processed"],
                    "successful_imports": result["successful_imports"],
                    "failed_imports": result["failed_imports"],
                    "duplicate_emails": result["duplicate_emails"]
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk import error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")


# ===== ANALYTICS ENDPOINTS =====

@app.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time dashboard"""
    await dashboard_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle messages
            data = await websocket.receive_text()
            # Echo back for ping/pong
            await websocket.send_text(f"pong: {data}")
    except WebSocketDisconnect:
        await dashboard_manager.disconnect(websocket)

@app.get("/api/analytics/metrics")
async def get_live_metrics(user_id: str = Depends(verify_token)):
    """Get current live metrics"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        metrics = await analytics.get_live_metrics()
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/user-behavior/{target_user_id}")
async def get_user_behavior(target_user_id: str, user_id: str = Depends(verify_token)):
    """Get behavior data for a specific user"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        behavior_data = await analytics.get_user_behavior_data(target_user_id)
        return behavior_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/segment-user/{target_user_id}")
async def segment_user(target_user_id: str, user_id: str = Depends(verify_token)):
    """Segment a specific user using ML"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        segment_data = await user_segmentation.segment_user(target_user_id)
        return segment_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/segments")
async def get_segment_analytics(user_id: str = Depends(verify_token)):
    """Get analytics for all user segments"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        segment_analytics = await user_segmentation.get_segment_analytics()
        return segment_analytics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/train-segmentation")
async def train_segmentation_model(user_id: str = Depends(verify_token)):
    """Train the user segmentation model"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        results = await user_segmentation.train_segmentation_model()
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/historical/{metric_name}")
async def get_historical_data(metric_name: str, hours: int = 24, user_id: str = Depends(verify_token)):
    """Get historical data for a specific metric"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        historical_data = await dashboard_manager.get_historical_data(metric_name, hours)
        return historical_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analytics/track-event")
async def track_custom_event(
    event_type: str,
    metadata: dict,
    user_id: str = Depends(verify_token)
):
    """Track a custom analytics event"""
    try:
        await analytics.track_user_event(
            user_id=user_id,
            event_type=event_type,
            metadata=metadata
        )
        
        return {"message": "Event tracked successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# === ADMIN RESERVATIONS MANAGEMENT ===

@app.get("/api/admin/reservations")
async def get_all_reservations(
    skip: int = 0,
    limit: int = 20,
    status_filter: str = None,
    event_filter: str = None,
    user_search: str = None,
    date_from: str = None,
    date_to: str = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    user_id: str = Depends(verify_token)
):
    """Get all reservations with admin privileges and filtering"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Build filter query
        filter_query = {}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if event_filter:
            filter_query["event_id"] = event_filter
            
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            filter_query["created_at"] = date_filter
        
        # Get reservations with filters
        sort_direction = -1 if sort_order == "desc" else 1
        reservations_cursor = db.reservations.find(filter_query).sort(sort_by, sort_direction).skip(skip).limit(limit)
        reservations = list(reservations_cursor)
        
        # Get user and event details for each reservation
        enriched_reservations = []
        for reservation in reservations:
            # Get user details
            user = db.users.find_one({"id": reservation["user_id"]})
            # Get event details  
            event = db.events.find_one({"id": reservation["event_id"]})
            
            # Filter by user search if provided
            if user_search and user:
                user_match = (
                    user_search.lower() in user.get("name", "").lower() or
                    user_search.lower() in user.get("email", "").lower() or
                    user_search.lower() in user.get("phone", "").lower() or
                    user_search.lower() in reservation.get("checkin_code", "").lower()
                )
                if not user_match:
                    continue
            
            enriched_reservation = {
                "id": reservation["id"],
                "status": reservation["status"],
                "created_at": reservation["created_at"],
                "qr_code": reservation["qr_code"],
                "checkin_code": reservation.get("checkin_code", ""),
                "checked_in_at": reservation.get("checked_in_at"),
                "cancelled_at": reservation.get("cancelled_at"),
                "cancelled_by": reservation.get("cancelled_by"),
                "checked_in_by": reservation.get("checked_in_by"),
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "phone": user.get("phone", "")
                } if user else None,
                "event": {
                    "id": event["id"],
                    "title": event["title"],
                    "date": event["date"],
                    "time": event["time"],
                    "location": event["location"]
                } if event else None
            }
            enriched_reservations.append(enriched_reservation)
        
        # Get total count for pagination
        total_count = db.reservations.count_documents(filter_query)
        
        return {
            "reservations": enriched_reservations,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching admin reservations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/reservations/metrics")
async def get_reservations_metrics(user_id: str = Depends(verify_token)):
    """Get comprehensive metrics for reservations"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Basic counts
        total_reservations = db.reservations.count_documents({})
        confirmed_reservations = db.reservations.count_documents({"status": "confirmed"})
        checked_in_reservations = db.reservations.count_documents({"status": "checked_in"})
        cancelled_reservations = db.reservations.count_documents({"status": "cancelled"})
        
        # Today's reservations
        today = datetime.utcnow().date().isoformat()
        today_reservations = db.reservations.count_documents({
            "created_at": {"$regex": f"^{today}"}
        })
        
        # This week's reservations
        week_ago = (datetime.utcnow() - timedelta(days=7)).date().isoformat()
        week_reservations = db.reservations.count_documents({
            "created_at": {"$gte": week_ago}
        })
        
        # Reservations by event
        pipeline = [
            {"$group": {"_id": "$event_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        top_events_cursor = db.reservations.aggregate(pipeline)
        top_events_data = list(top_events_cursor)
        
        # Enrich with event details
        top_events = []
        for event_data in top_events_data:
            event = db.events.find_one({"id": event_data["_id"]})
            if event:
                top_events.append({
                    "event_title": event["title"],
                    "event_id": event["id"],
                    "reservation_count": event_data["count"]
                })
        
        return {
            "total_reservations": total_reservations,
            "confirmed": confirmed_reservations,
            "checked_in": checked_in_reservations,
            "cancelled": cancelled_reservations,
            "today_reservations": today_reservations,
            "week_reservations": week_reservations,
            "top_events": top_events,
            "checkin_rate": round((checked_in_reservations / max(total_reservations, 1)) * 100, 1),
            "cancellation_rate": round((cancelled_reservations / max(total_reservations, 1)) * 100, 1)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching reservations metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/reservations/{reservation_id}/checkin")
async def admin_checkin_reservation(reservation_id: str, user_id: str = Depends(verify_token)):
    """Manually check in a reservation as admin"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Find reservation
        reservation = db.reservations.find_one({"id": reservation_id})
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        if reservation["status"] == "checked_in":
            raise HTTPException(status_code=400, detail="Already checked in")
            
        if reservation["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Cannot check in cancelled reservation")
        
        # Update reservation status
        db.reservations.update_one(
            {"id": reservation_id},
            {"$set": {
                "status": "checked_in", 
                "checked_in_at": datetime.utcnow().isoformat(),
                "checked_in_by": "admin"
            }}
        )
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="admin_checkin",
                metadata={
                    "reservation_id": reservation_id,
                    "user_id": reservation["user_id"]
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {"message": "Reservation checked in successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin checkin: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def send_admin_cancellation_email(user_email: str, user_name: str, event_title: str, event_date: str, event_time: str):
    """Send email notification when admin cancels a reservation"""
    try:
        subject = f"Reserva Cancelada - {event_title}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="margin: 0; font-size: 28px;">Reserva Cancelada</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-bottom: 20px;">Hola {user_name},</h2>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Lamentamos informarte que tu reserva para el siguiente evento ha sido cancelada por motivos administrativos:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h3 style="color: #333; margin: 0 0 10px 0;">{event_title}</h3>
                        <p style="color: #666; margin: 5px 0;"><strong>Fecha:</strong> {event_date}</p>
                        <p style="color: #666; margin: 5px 0;"><strong>Hora:</strong> {event_time}</p>
                    </div>
                    
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">
                        Si tienes alguna pregunta o inquietud, por favor contáctanos directamente.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #666; font-size: 14px;">
                            Cultural Center Visitor Management Platform
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        plain_content = f"""
        Reserva Cancelada: {event_title}
        
        Hola {user_name},
        
        Lamentamos informarte que tu reserva para el siguiente evento ha sido cancelada por motivos administrativos:
        
        Evento: {event_title}
        Fecha: {event_date}
        Hora: {event_time}
        
        Si tienes alguna pregunta o inquietud, por favor contáctanos directamente.
        
        Cultural Center Visitor Management Platform
        """
        
        send_email(user_email, subject, html_content, plain_content)
        
    except Exception as e:
        logger.error(f"Error sending admin cancellation email: {e}")

@app.delete("/api/admin/reservations/{reservation_id}")
async def admin_cancel_reservation(reservation_id: str, user_id: str = Depends(verify_token)):
    """Cancel a reservation as admin"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Find reservation
        reservation = db.reservations.find_one({"id": reservation_id})
        if not reservation:
            raise HTTPException(status_code=404, detail="Reservation not found")
        
        if reservation["status"] == "cancelled":
            raise HTTPException(status_code=400, detail="Reservation already cancelled")
        
        # Get user and event details for notification
        user = db.users.find_one({"id": reservation["user_id"]})
        event = db.events.find_one({"id": reservation["event_id"]})
        
        # Update reservation status
        db.reservations.update_one(
            {"id": reservation_id},
            {"$set": {
                "status": "cancelled",
                "cancelled_at": datetime.utcnow().isoformat(),
                "cancelled_by": "admin"
            }}
        )
        
        # Send cancellation notification email
        if user and event:
            send_admin_cancellation_email(
                user["email"],
                user["name"],
                event["title"],
                event["date"],
                event["time"]
            )
        
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="admin_cancellation",
                metadata={
                    "reservation_id": reservation_id,
                    "cancelled_user_id": reservation["user_id"]
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
        
        return {"message": "Reservation cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin cancellation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/reservations/bulk-action")
async def bulk_reservations_action(request: dict, user_id: str = Depends(verify_token)):
    """Perform bulk actions on multiple reservations"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        action = request.get("action")
        reservation_ids = request.get("reservation_ids", [])
        
        if not action or not reservation_ids:
            raise HTTPException(status_code=400, detail="Action and reservation_ids are required")
        
        result = {"updated": 0, "message": ""}
        
        if action == "cancel":
            update_result = db.reservations.update_many(
                {"id": {"$in": reservation_ids}, "status": {"$ne": "cancelled"}},
                {"$set": {
                    "status": "cancelled",
                    "cancelled_at": datetime.utcnow().isoformat(),
                    "cancelled_by": "admin"
                }}
            )
            result["updated"] = update_result.modified_count
            result["message"] = f"{update_result.modified_count} reservas canceladas"
            
        elif action == "checkin":
            update_result = db.reservations.update_many(
                {"id": {"$in": reservation_ids}, "status": "confirmed"},
                {"$set": {
                    "status": "checked_in",
                    "checked_in_at": datetime.utcnow().isoformat(),
                    "checked_in_by": "admin"
                }}
            )
            result["updated"] = update_result.modified_count
            result["message"] = f"{update_result.modified_count} reservas registradas"
            
        # Track analytics
        try:
            await analytics.track_user_event(
                user_id=user_id,
                event_type="bulk_reservation_action",
                metadata={
                    "action": action,
                    "reservation_count": len(reservation_ids),
                    "updated_count": result["updated"]
                }
            )
        except Exception as analytics_error:
            logger.warning(f"Failed to track analytics: {analytics_error}")
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in bulk reservations action: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/reservations/export")
async def export_reservations(
    format: str = "csv",
    status_filter: str = None,
    event_filter: str = None,
    date_from: str = None,
    date_to: str = None,
    user_id: str = Depends(verify_token)
):
    """Export reservations data"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Build filter query
        filter_query = {}
        
        if status_filter:
            filter_query["status"] = status_filter
            
        if event_filter:
            filter_query["event_id"] = event_filter
            
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter["$gte"] = date_from
            if date_to:
                date_filter["$lte"] = date_to
            filter_query["created_at"] = date_filter
        
        # Get all reservations (no pagination for export)
        reservations = list(db.reservations.find(filter_query))
        
        # Enrich with user and event data
        export_data = []
        for reservation in reservations:
            user = db.users.find_one({"id": reservation["user_id"]})
            event = db.events.find_one({"id": reservation["event_id"]})
            
            export_item = {
                "reservation_id": reservation["id"],
                "checkin_code": reservation.get("checkin_code", ""),
                "status": reservation["status"],
                "created_at": reservation["created_at"],
                "checked_in_at": reservation.get("checked_in_at", ""),
                "cancelled_at": reservation.get("cancelled_at", ""),
                "checked_in_by": reservation.get("checked_in_by", ""),
                "cancelled_by": reservation.get("cancelled_by", ""),
                "user_name": user["name"] if user else "Usuario eliminado",
                "user_email": user["email"] if user else "N/A",
                "user_phone": user.get("phone", "") if user else "N/A",
                "user_age": user.get("age", "") if user else "N/A",
                "user_location": user.get("location", "") if user else "N/A",
                "event_title": event["title"] if event else "Evento eliminado",
                "event_date": event["date"] if event else "N/A",
                "event_time": event["time"] if event else "N/A",
                "event_location": event["location"] if event else "N/A",
                "event_category": event["category"] if event else "N/A",
                "event_capacity": event["capacity"] if event else "N/A"
            }
            export_data.append(export_item)
        
        if format.lower() == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if export_data:
                writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
                writer.writeheader()
                writer.writerows(export_data)
            
            content = output.getvalue()
            output.close()
            
            return Response(
                content=content,
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=reservations_export.csv"}
            )
        else:
            # JSON format
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content=export_data,
                headers={"Content-Disposition": "attachment; filename=reservations_export.json"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting reservations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/events/{event_id}/attendance-report")
async def get_event_attendance_report(event_id: str, user_id: str = Depends(verify_token)):
    """Generate detailed attendance report for a specific event"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Get event details
        event = db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
            
        # Get all reservations for this event
        reservations = list(db.reservations.find({"event_id": event_id}))
        
        # Build detailed attendance data
        attendance_data = []
        for reservation in reservations:
            user = db.users.find_one({"id": reservation["user_id"]})
            if user:
                attendance_data.append({
                    "user_name": user["name"],
                    "user_email": user["email"],
                    "user_phone": user.get("phone", ""),
                    "user_age": user.get("age", ""),
                    "user_location": user.get("location", ""),
                    "reservation_id": reservation["id"],
                    "checkin_code": reservation.get("checkin_code", ""),
                    "status": reservation["status"],
                    "reserved_at": reservation["created_at"],
                    "checked_in_at": reservation.get("checked_in_at"),
                    "cancelled_at": reservation.get("cancelled_at"),
                    "attended": reservation["status"] == "checked_in"
                })
        
        # Calculate metrics
        total_reservations = len(attendance_data)
        total_attended = len([a for a in attendance_data if a["attended"]])
        total_confirmed = len([a for a in attendance_data if a["status"] == "confirmed"])
        total_cancelled = len([a for a in attendance_data if a["status"] == "cancelled"])
        attendance_rate = (total_attended / total_reservations * 100) if total_reservations > 0 else 0
        
        # Demographic breakdown for attendees
        attendees = [a for a in attendance_data if a["attended"]]
        age_groups = {}
        locations = {}
        
        for attendee in attendees:
            # Age groups
            if attendee["user_age"]:
                age = int(attendee["user_age"])
                if age < 18:
                    age_group = "Menor de 18"
                elif age < 30:
                    age_group = "18-29"
                elif age < 45:
                    age_group = "30-44"
                elif age < 60:
                    age_group = "45-59"
                else:
                    age_group = "60+"
                age_groups[age_group] = age_groups.get(age_group, 0) + 1
            
            # Locations
            if attendee["user_location"]:
                location = attendee["user_location"]
                locations[location] = locations.get(location, 0) + 1
        
        return {
            "event": {
                "id": event["id"],
                "title": event["title"],
                "date": event["date"],
                "time": event["time"],
                "location": event["location"],
                "capacity": event["capacity"],
                "category": event["category"]
            },
            "summary": {
                "total_reservations": total_reservations,
                "total_attended": total_attended,
                "total_confirmed": total_confirmed,
                "total_cancelled": total_cancelled,
                "attendance_rate": round(attendance_rate, 1),
                "capacity_utilization": round((total_reservations / event["capacity"]) * 100, 1)
            },
            "demographics": {
                "age_groups": age_groups,
                "locations": locations
            },
            "attendance_list": attendance_data,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating attendance report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/reports/attendance-summary")
async def get_attendance_summary_report(
    date_from: str = None,
    date_to: str = None,
    category: str = None,
    user_id: str = Depends(verify_token)
):
    """Generate summary attendance report across multiple events"""
    try:
        # Check if user is admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
            
        # Build event filter
        event_filter = {}
        if date_from:
            event_filter["date"] = {"$gte": date_from}
        if date_to:
            if "date" in event_filter:
                event_filter["date"]["$lte"] = date_to
            else:
                event_filter["date"] = {"$lte": date_to}
        if category:
            event_filter["category"] = category
            
        # Get filtered events
        events = list(db.events.find(event_filter))
        
        summary_data = []
        total_capacity = 0
        total_reservations = 0
        total_attended = 0
        
        for event in events:
            # Get reservations for this event
            event_reservations = list(db.reservations.find({"event_id": event["id"]}))
            event_attended = len([r for r in event_reservations if r["status"] == "checked_in"])
            event_cancelled = len([r for r in event_reservations if r["status"] == "cancelled"])
            
            attendance_rate = (event_attended / len(event_reservations) * 100) if event_reservations else 0
            capacity_utilization = (len(event_reservations) / event["capacity"] * 100)
            
            summary_data.append({
                "event_id": event["id"],
                "event_title": event["title"],
                "event_date": event["date"],
                "event_time": event["time"],
                "event_category": event["category"],
                "capacity": event["capacity"],
                "total_reservations": len(event_reservations),
                "total_attended": event_attended,
                "total_cancelled": event_cancelled,
                "attendance_rate": round(attendance_rate, 1),
                "capacity_utilization": round(capacity_utilization, 1)
            })
            
            total_capacity += event["capacity"]
            total_reservations += len(event_reservations)
            total_attended += event_attended
        
        overall_attendance_rate = (total_attended / total_reservations * 100) if total_reservations > 0 else 0
        overall_capacity_utilization = (total_reservations / total_capacity * 100) if total_capacity > 0 else 0
        
        return {
            "summary": {
                "total_events": len(events),
                "total_capacity": total_capacity,
                "total_reservations": total_reservations,
                "total_attended": total_attended,
                "overall_attendance_rate": round(overall_attendance_rate, 1),
                "overall_capacity_utilization": round(overall_capacity_utilization, 1)
            },
            "events": summary_data,
            "filters_applied": {
                "date_from": date_from,
                "date_to": date_to,
                "category": category
            },
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating attendance summary report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== REPORTES PROFESIONALES ====================

@app.get("/api/admin/reports/professional/event/{event_id}")
async def generate_professional_event_report(event_id: str, user_id: str = Depends(verify_token)):
    """Generar reporte profesional PDF para un evento específico"""
    try:
        # Verificar permisos de admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Obtener datos del evento
        event = db.events.find_one({"id": event_id})
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Obtener todas las reservas del evento
        reservations = list(db.reservations.find({"event_id": event_id}))
        
        # Obtener datos de usuarios
        participants = []
        age_distribution = {}
        location_distribution = {}
        
        total_reservations = len(reservations)
        total_attendees = len([r for r in reservations if r["status"] == "checked_in"])
        total_cancellations = len([r for r in reservations if r["status"] == "cancelled"])
        
        for reservation in reservations:
            user = db.users.find_one({"id": reservation["user_id"]})
            if user:
                participant_data = {
                    "name": user.get("name", ""),
                    "email": user.get("email", ""),
                    "phone": user.get("phone", ""),
                    "age": user.get("age", 0),
                    "location": user.get("location", ""),
                    "checked_in": reservation["status"] == "checked_in",
                    "status": reservation["status"]
                }
                participants.append(participant_data)
                
                # Distribución por edad
                age = user.get("age", 0)
                if age < 20:
                    age_range = "< 20"
                elif age < 30:
                    age_range = "20-29"
                elif age < 40:
                    age_range = "30-39"
                elif age < 50:
                    age_range = "40-49"
                elif age < 60:
                    age_range = "50-59"
                else:
                    age_range = "60+"
                
                age_distribution[age_range] = age_distribution.get(age_range, 0) + 1
                
                # Distribución por ubicación
                location = user.get("location", "No especificado")
                location_distribution[location] = location_distribution.get(location, 0) + 1
        
        # Calcular métricas
        attendance_rate = (total_attendees / total_reservations * 100) if total_reservations > 0 else 0
        capacity_utilization = (total_reservations / event["capacity"] * 100) if event["capacity"] > 0 else 0
        
        # Preparar datos para el reporte
        event_data = {
            "title": event["title"],
            "date": event["date"],
            "time": event["time"],
            "location": event["location"],
            "capacity": event["capacity"],
            "category": event["category"],
            "metrics": {
                "total_reservations": total_reservations,
                "total_attendees": total_attendees,
                "total_cancellations": total_cancellations,
                "attendance_rate": attendance_rate,
                "capacity_utilization": capacity_utilization
            },
            "demographics": {
                "age_distribution": age_distribution,
                "location_distribution": location_distribution
            },
            "participants": participants
        }
        
        # Generar reporte PDF con el nuevo sistema HTML
        from reports.pdfdocument_generator import PDFDocumentReportGenerator
        generator = PDFDocumentReportGenerator()
        
        # Adaptar datos para el nuevo formato
        event_data = {
            "title": event["title"],
            "date": event["date"],
            "time": event["time"],
            "location": event["location"],
            "capacity": event["capacity"],
            "category": event["category"],
            "description": event.get("description", ""),
            "price": event.get("price", 0)
        }
        
        # Adaptar participantes para el nuevo formato
        participants_data = []
        for participant in participants:
            participants_data.append({
                "user_name": participant["name"],
                "user_email": participant["email"],
                "user_phone": participant["phone"],
                "status": "confirmed" if participant["checked_in"] else "pending",
                "created_at": datetime.now().isoformat()
            })
        
        # Generar PDF usando PDFDocument (retorna bytes directamente)
        pdf_bytes = generator.generate_event_report(event_data, participants_data)
        
        # Retornar PDF como respuesta
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Reporte_Evento_{event['title'].replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/reports/professional/monthly")
async def generate_professional_monthly_report(
    month: int = None,
    year: int = None,
    user_id: str = Depends(verify_token)
):
    """Generar reporte mensual profesional consolidado"""
    try:
        # Verificar permisos de admin
        user_doc = db.users.find_one({"id": user_id})
        if not user_doc or not user_doc.get("is_admin"):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Usar mes y año actual si no se especifican
        if not month or not year:
            now = datetime.now()
            month = month or now.month
            year = year or now.year
        
        # Calcular rango de fechas
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")
        
        # Obtener eventos del mes
        events = list(db.events.find({
            "date": {"$gte": start_date_str, "$lt": end_date_str}
        }))
        
        # Preparar datos del reporte
        events_data = []
        total_reservations = 0
        total_attendees = 0
        total_cancellations = 0
        total_events = len(events)
        
        age_distribution = {}
        location_distribution = {}
        
        for event in events:
            # Obtener reservas del evento
            reservations = list(db.reservations.find({"event_id": event["id"]}))
            
            event_reservations = len(reservations)
            event_attendees = len([r for r in reservations if r["status"] == "checked_in"])
            event_cancellations = len([r for r in reservations if r["status"] == "cancelled"])
            
            total_reservations += event_reservations
            total_attendees += event_attendees
            total_cancellations += event_cancellations
            
            # Datos del evento para la tabla
            events_data.append({
                "title": event["title"],
                "date": event["date"],
                "reservations": event_reservations,
                "attendees": event_attendees,
                "cancellations": event_cancellations
            })
            
            # Obtener datos demográficos
            for reservation in reservations:
                if reservation["status"] != "cancelled":
                    user = db.users.find_one({"id": reservation["user_id"]})
                    if user:
                        # Distribución por edad
                        age = user.get("age", 0)
                        if age < 20:
                            age_range = "< 20"
                        elif age < 30:
                            age_range = "20-29"
                        elif age < 40:
                            age_range = "30-39"
                        elif age < 50:
                            age_range = "40-49"
                        elif age < 60:
                            age_range = "50-59"
                        else:
                            age_range = "60+"
                        
                        age_distribution[age_range] = age_distribution.get(age_range, 0) + 1
                        
                        # Distribución por ubicación
                        location = user.get("location", "No especificado")
                        location_distribution[location] = location_distribution.get(location, 0) + 1
        
        # Calcular métricas promedio
        avg_attendance_rate = (total_attendees / total_reservations * 100) if total_reservations > 0 else 0
        total_capacity = sum([event["capacity"] for event in events])
        avg_capacity_utilization = (total_reservations / total_capacity * 100) if total_capacity > 0 else 0
        
        # Preparar datos para gráficos de rendimiento
        performance_data = {
            "months": [f"{year}-{month:02d}"],
            "attendance": [total_attendees],
            "capacity": [total_capacity]
        }
        
        # Preparar datos del reporte mensual
        month_names = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        
        monthly_data = {
            "period": f"{month_names[month]} {year}",
            "total_events": total_events,
            "total_reservations": total_reservations,
            "total_attendees": total_attendees,
            "total_cancellations": total_cancellations,
            "avg_attendance_rate": avg_attendance_rate,
            "avg_capacity_utilization": avg_capacity_utilization,
            "metrics": {
                "total_reservations": total_reservations,
                "total_attendees": total_attendees,
                "total_cancellations": total_cancellations,
                "attendance_rate": avg_attendance_rate,
                "capacity_utilization": avg_capacity_utilization
            },
            "events": events_data,
            "demographics": {
                "age_distribution": age_distribution,
                "location_distribution": location_distribution
            },
            "performance_data": performance_data
        }
        
        # Generar reporte PDF
        from reports.professional_generator import ProfessionalReportGenerator
        generator = ProfessionalReportGenerator()
        pdf_bytes = generator.generate_monthly_report(monthly_data)
        
        # Retornar PDF como respuesta
        from fastapi.responses import Response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=Reporte_Mensual_{month_names[month]}_{year}.pdf"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)