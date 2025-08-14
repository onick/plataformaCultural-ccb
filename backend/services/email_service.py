"""
Email service for sending automated emails via SendGrid.
"""

import logging
from typing import Optional, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from core.config import settings
from core.database import database

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails through SendGrid."""
    
    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = getattr(settings, 'SENDGRID_FROM_EMAIL', getattr(settings, 'FROM_EMAIL', 'noreply@banreservas.com.do'))
        self.client = SendGridAPIClient(api_key=self.api_key) if self.api_key else None
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        html_content: str, 
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using SendGrid.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            plain_content: Plain text content (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            if not self.client:
                logger.warning("SendGrid API key not configured - email not sent")
                return False
            
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_content or html_content
            )
            
            response = self.client.send(message)
            logger.info(f"Email sent successfully to {to_email}, status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """
        Send welcome email after registration.
        
        Args:
            user_email: User's email address
            user_name: User's name
            
        Returns:
            True if sent successfully
        """
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
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{settings.FRONTEND_URL}" 
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
        
        Visit: {settings.FRONTEND_URL}
        
        Cultural Center Visitor Management Platform
        """
        
        return self.send_email(user_email, subject, html_content, plain_content)
    
    def send_reservation_confirmation(
        self,
        user_email: str,
        user_name: str,
        event_data: Dict[str, Any],
        qr_code_data: str,
        checkin_code: str
    ) -> bool:
        """
        Send reservation confirmation email with QR code.
        
        Args:
            user_email: User's email
            user_name: User's name
            event_data: Event information dictionary
            qr_code_data: QR code data URI
            checkin_code: Check-in code
            
        Returns:
            True if sent successfully
        """
        subject = f"Reservation Confirmed: {event_data['title']}"
        
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
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">{event_data['title']}</h3>
                        <p style="color: #555; margin: 5px 0;"><strong>Date:</strong> {event_data['date']}</p>
                        <p style="color: #555; margin: 5px 0;"><strong>Time:</strong> {event_data['time']}</p>
                        <p style="color: #555; margin: 5px 0;"><strong>Location:</strong> {event_data['location']}</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <h3 style="color: #333;">Check-in Options</h3>
                        <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                            <img src="{qr_code_data}" alt="QR Code" style="max-width: 200px; height: auto;" />
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 10px;">
                            Option 1: Present this QR code at the entrance
                        </p>
                        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #333; margin: 0 0 10px 0;">Option 2: Check-in Code</h4>
                            <div style="font-size: 24px; font-weight: bold; color: #2563eb; letter-spacing: 2px; font-family: monospace;">
                                {checkin_code}
                            </div>
                            <p style="color: #555; font-size: 14px; margin: 10px 0 0 0;">
                                Use this code at check-in or with your email/phone
                            </p>
                        </div>
                    </div>
                    
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="color: #2d5016; margin: 0; font-size: 14px;">
                            <strong>Important:</strong> Please arrive 15 minutes before the event starts. 
                            Save this email or take a screenshot of the QR code for easy access.
                        </p>
                    </div>
                </div>
            </body>
        </html>
        """
        
        plain_content = f"""
        Reservation Confirmed: {event_data['title']}
        
        Hello {user_name}!
        
        Your reservation has been confirmed for:
        
        Event: {event_data['title']}
        Date: {event_data['date']}
        Time: {event_data['time']}
        Location: {event_data['location']}
        
        CHECK-IN OPTIONS:
        
        Option 1: Present the QR code at the entrance
        Option 2: Use your check-in code: {checkin_code}
        Option 3: Check-in with your email or phone number
        
        Important: Please arrive 15 minutes before the event starts.
        
        Cultural Center Visitor Management Platform
        """
        
        return self.send_email(user_email, subject, html_content, plain_content)
    
    def send_checkin_confirmation(
        self,
        user_email: str,
        user_name: str,
        event_title: str
    ) -> bool:
        """
        Send check-in confirmation email.
        
        Args:
            user_email: User's email
            user_name: User's name
            event_title: Event title
            
        Returns:
            True if sent successfully
        """
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
        
        return self.send_email(user_email, subject, html_content, plain_content)
    
    def send_cancellation_confirmation(
        self,
        user_email: str,
        user_name: str,
        event_data: Dict[str, Any],
        cancellation_time: str
    ) -> bool:
        """
        Send reservation cancellation confirmation email.
        
        Args:
            user_email: User's email
            user_name: User's name
            event_data: Event information
            cancellation_time: Time of cancellation
            
        Returns:
            True if sent successfully
        """
        subject = f"Reservation Cancelled: {event_data['title']}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Reservation Cancelled</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Hello {user_name},</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        Your reservation has been cancelled for:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">{event_data['title']}</h3>
                        <p style="color: #555; margin: 5px 0;"><strong>Date:</strong> {event_data['date']}</p>
                        <p style="color: #555; margin: 5px 0;"><strong>Time:</strong> {event_data['time']}</p>
                        <p style="color: #555; margin: 5px 0;"><strong>Location:</strong> {event_data['location']}</p>
                        <p style="color: #888; margin: 10px 0 0 0; font-size: 14px;">
                            Cancelled on: {cancellation_time}
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        We hope to see you at other events in the future. Feel free to explore our upcoming events and make new reservations.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{settings.FRONTEND_URL}" 
                           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Explore Other Events
                        </a>
                    </div>
                </div>
            </body>
        </html>
        """
        
        plain_content = f"""
        Reservation Cancelled: {event_data['title']}
        
        Hello {user_name},
        
        Your reservation has been cancelled for:
        
        Event: {event_data['title']}
        Date: {event_data['date']}
        Time: {event_data['time']}
        Location: {event_data['location']}
        
        Cancelled on: {cancellation_time}
        
        We hope to see you at other events in the future. Feel free to explore our upcoming events and make new reservations.
        
        Visit: {settings.FRONTEND_URL}
        
        Cultural Center Visitor Management Platform
        """
        
        return self.send_email(user_email, subject, html_content, plain_content)


    def send_invitation_declined_notification(
        self,
        user_email: str,
        event_title: str,
        decline_reason: Optional[str] = None
    ) -> bool:
        """
        Send notification to admin when invitation is declined.
        
        Args:
            user_email: Email of user who declined
            event_title: Title of the event
            decline_reason: Optional reason for declining
            
        Returns:
            True if sent successfully
        """
        subject = f"Invitation Declined: {event_title}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Invitation Declined</h1>
                </div>
                <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                    <h2 style="color: #333; margin-top: 0;">Event Invitation Update</h2>
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        A user has declined their invitation to the following event:
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                        <h3 style="color: #333; margin: 0 0 10px 0; font-size: 20px;">{event_title}</h3>
                        <p style="color: #555; margin: 5px 0;"><strong>User:</strong> {user_email}</p>
                        {f'<p style="color: #555; margin: 5px 0;"><strong>Reason:</strong> {decline_reason}</p>' if decline_reason else ''}
                        <p style="color: #888; margin: 10px 0 0 0; font-size: 14px;">
                            Declined at: {database.get_current_timestamp()}
                        </p>
                    </div>
                    
                    <p style="color: #555; font-size: 16px; line-height: 1.6;">
                        The reservation slot is now available for other attendees. You may want to review the event capacity and send invitations to other interested users.
                    </p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{settings.FRONTEND_URL}/admin/events" 
                           style="background: linear-gradient(135deg, #003087 0%, #0066CC 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Manage Events
                        </a>
                    </div>
                </div>
            </body>
        </html>
        """
        
        plain_content = f"""
        Invitation Declined: {event_title}
        
        Event Invitation Update
        
        A user has declined their invitation to the following event:
        
        Event: {event_title}
        User: {user_email}
        {f'Reason: {decline_reason}' if decline_reason else ''}
        Declined at: {database.get_current_timestamp()}
        
        The reservation slot is now available for other attendees. You may want to review the event capacity and send invitations to other interested users.
        
        Visit: {settings.FRONTEND_URL}/admin/events
        
        Centro Cultural Banreservas - Admin Notification
        """
        
        # Send to admin email (you might want to make this configurable)
        admin_email = getattr(settings, 'ADMIN_EMAIL', self.from_email)
        return self.send_email(admin_email, subject, html_content, plain_content)


# Create a singleton instance
email_service = EmailService()

# Async wrapper functions for easy import
async def send_invitation_declined_notification(
    user_email: str,
    event_title: str,
    decline_reason: Optional[str] = None
) -> bool:
    """Async wrapper for invitation declined notification"""
    return email_service.send_invitation_declined_notification(
        user_email, event_title, decline_reason
    )