"""
Email utilities using SendGrid
"""

import logging
from typing import Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from core.config import settings

logger = logging.getLogger(__name__)

# Initialize SendGrid client if API key is available
sg_client = None
if settings.SENDGRID_API_KEY:
    try:
        sg_client = SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
        logger.info("✅ SendGrid client initialized")
    except Exception as e:
        logger.warning(f"⚠️ Failed to initialize SendGrid: {e}")
else:
    logger.warning("⚠️ SendGrid API key not configured")


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_email: Optional[str] = None
) -> bool:
    """Send email using SendGrid"""
    if not sg_client:
        logger.warning("SendGrid not configured, email not sent")
        return False
    
    try:
        message = Mail(
            from_email=from_email or settings.FROM_EMAIL,
            to_emails=to_email,
            subject=subject,
            html_content=html_content
        )
        
        response = sg_client.send(message)
        
        if response.status_code == 202:
            logger.info(f"✅ Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"❌ Failed to send email: {response.status_code}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error sending email: {e}")
        return False


async def send_welcome_email(email: str, name: str) -> bool:
    """Send welcome email to new user"""
    subject = "¡Bienvenido al Centro Cultural Banreservas!"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #003087, #0066CC); padding: 30px; text-align: center;">
                <h1 style="color: #FFD700; margin: 0;">Centro Cultural Banreservas</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #003087;">¡Hola {name}!</h2>
                
                <p>Te damos la bienvenida al Centro Cultural Banreservas. Estamos emocionados de tenerte como parte de nuestra comunidad cultural.</p>
                
                <p>Con tu cuenta podrás:</p>
                <ul style="color: #555;">
                    <li>Reservar asientos para eventos culturales</li>
                    <li>Recibir notificaciones de nuevos eventos</li>
                    <li>Acceder a tu historial de reservas</li>
                    <li>Disfrutar de experiencias culturales únicas</li>
                </ul>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="http://localhost:3002" 
                       style="background: #003087; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Explorar Eventos
                    </a>
                </div>
                
                <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                
                <p style="color: #777; font-size: 14px;">
                    ¡Gracias por formar parte de nuestra comunidad cultural!
                </p>
            </div>
            
            <div style="background: #003087; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>Centro Cultural Banreservas</p>
                <p>Santo Domingo, República Dominicana</p>
            </div>
        </body>
    </html>
    """
    
    return await send_email(email, subject, html_content)


async def send_reservation_confirmation_email(
    email: str, 
    name: str, 
    event_title: str, 
    event_date: str, 
    event_time: str,
    reservation_code: str,
    qr_code: Optional[str] = None
) -> bool:
    """Send reservation confirmation email"""
    subject = f"Confirmación de Reserva - {event_title}"
    
    qr_section = ""
    if qr_code:
        qr_section = f"""
        <div style="text-align: center; margin: 20px 0;">
            <p><strong>Código QR para Check-in:</strong></p>
            <img src="data:image/png;base64,{qr_code}" alt="QR Code" style="max-width: 200px;">
        </div>
        """
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #003087, #0066CC); padding: 30px; text-align: center;">
                <h1 style="color: #FFD700; margin: 0;">Reserva Confirmada</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #003087;">¡Hola {name}!</h2>
                
                <p>Tu reserva ha sido confirmada exitosamente.</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FFD700;">
                    <h3 style="color: #003087; margin-top: 0;">{event_title}</h3>
                    <p><strong>Fecha:</strong> {event_date}</p>
                    <p><strong>Hora:</strong> {event_time}</p>
                    <p><strong>Código de Reserva:</strong> <span style="background: #003087; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">{reservation_code}</span></p>
                </div>
                
                {qr_section}
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <p style="margin: 0; color: #1565c0;"><strong>Instrucciones importantes:</strong></p>
                    <ul style="margin: 10px 0; color: #1565c0;">
                        <li>Llega 15 minutos antes del evento</li>
                        <li>Presenta tu código QR o código de reserva en la entrada</li>
                        <li>Guarda este email para futuras referencias</li>
                    </ul>
                </div>
                
                <p>¡Esperamos verte en el evento!</p>
            </div>
            
            <div style="background: #003087; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>Centro Cultural Banreservas</p>
            </div>
        </body>
    </html>
    """
    
    return await send_email(email, subject, html_content)


async def send_password_reset_email(email: str, name: str, reset_token: str) -> bool:
    """Send password reset email"""
    subject = "Restablecimiento de Contraseña - Centro Cultural"
    
    reset_link = f"http://localhost:3002/reset-password?token={reset_token}"
    
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #003087, #0066CC); padding: 30px; text-align: center;">
                <h1 style="color: #FFD700; margin: 0;">Restablecimiento de Contraseña</h1>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #003087;">Hola {name}</h2>
                
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background: #003087; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Restablecer Contraseña
                    </a>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                    Este enlace expirará en 1 hora por motivos de seguridad.
                </p>
                
                <p style="font-size: 14px; color: #666;">
                    Si no solicitaste este cambio, puedes ignorar este email.
                </p>
            </div>
            
            <div style="background: #003087; color: white; padding: 20px; text-align: center; font-size: 12px;">
                <p>Centro Cultural Banreservas</p>
            </div>
        </body>
    </html>
    """
    
    return await send_email(email, subject, html_content)
