"""
Invitations API endpoints
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional
import jwt
from datetime import datetime, timedelta

from models.common import SuccessResponse, ErrorResponse
from core.security import verify_token
from core.database import database
from core.config import settings
from services.email_service import send_invitation_declined_notification

router = APIRouter()


def generate_invitation_token(invitation_data: dict) -> str:
    """Generate a secure token for invitation actions"""
    payload = {
        **invitation_data,
        "exp": datetime.utcnow() + timedelta(hours=24),  # 24 hour expiry
        "type": "invitation_action"
    }
    
    return jwt.encode(
        payload, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )


def verify_invitation_token(token: str) -> dict:
    """Verify invitation token and return payload"""
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        
        if payload.get("type") != "invitation_action":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid token type"
            )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation link has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation token"
        )


@router.get("/invitations/decline")
async def decline_invitation_via_email(
    token: str = Query(..., description="Invitation decline token"),
    reason: Optional[str] = Query(None, description="Optional decline reason")
):
    """
    Decline an invitation via email link
    This endpoint is accessed directly from email links
    """
    try:
        # Verify the token
        payload = verify_invitation_token(token)
        
        invitation_type = payload.get("invitation_type")
        invitation_id = payload.get("invitation_id")
        user_email = payload.get("user_email")
        event_id = payload.get("event_id")
        
        if not all([invitation_type, invitation_id, user_email]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid invitation token data"
            )
        
        # Find the invitation/reservation
        if invitation_type == "event_invitation":
            # Handle event invitation decline
            reservation = database.reservations.find_one({
                "id": invitation_id,
                "user_email": user_email,
                "status": {"$in": ["confirmed", "pending"]}
            })
            
            if not reservation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invitation not found or already processed"
                )
            
            # Update reservation status
            update_result = database.reservations.update_one(
                {"id": invitation_id},
                {
                    "$set": {
                        "status": "declined",
                        "decline_reason": reason or "Declined via email",
                        "declined_at": database.get_current_timestamp(),
                        "updated_at": database.get_current_timestamp()
                    }
                }
            )
            
            if update_result.modified_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to decline invitation"
                )
            
            # Get event details for response
            event = database.events.find_one({"id": event_id})
            event_title = event.get("title", "Unknown Event") if event else "Unknown Event"
            
            # Send notification to admin (optional)
            try:
                await send_invitation_declined_notification(
                    user_email=user_email,
                    event_title=event_title,
                    decline_reason=reason
                )
            except Exception as e:
                # Don't fail the decline if notification fails
                print(f"Failed to send decline notification: {e}")
            
            # Create a user-friendly HTML response
            html_response = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invitación Declinada - Centro Cultural Banreservas</title>
                <style>
                    body {{
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f5f5f5;
                    }}
                    .container {{
                        background: white;
                        padding: 40px;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        text-align: center;
                    }}
                    .logo {{
                        width: 80px;
                        height: 80px;
                        background: linear-gradient(135deg, #003087, #0066CC);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px;
                        color: white;
                        font-size: 24px;
                        font-weight: bold;
                    }}
                    .title {{
                        color: #003087;
                        margin-bottom: 20px;
                        font-size: 28px;
                        font-weight: 600;
                    }}
                    .message {{
                        font-size: 16px;
                        margin-bottom: 30px;
                        color: #666;
                    }}
                    .event-info {{
                        background: #f8f9fa;
                        padding: 20px;
                        border-radius: 8px;
                        margin: 20px 0;
                        border-left: 4px solid #003087;
                    }}
                    .button {{
                        display: inline-block;
                        background: #003087;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 500;
                        margin-top: 20px;
                    }}
                    .footer {{
                        margin-top: 40px;
                        font-size: 14px;
                        color: #888;
                    }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">CCB</div>
                    <h1 class="title">Invitación Declinada</h1>
                    <p class="message">
                        Has declinado exitosamente tu invitación al evento:
                    </p>
                    <div class="event-info">
                        <strong>{event_title}</strong>
                    </div>
                    <p>
                        Tu reserva ha sido cancelada y el espacio estará disponible para otros usuarios.
                    </p>
                    {f'<p><em>Razón: {reason}</em></p>' if reason else ''}
                    <a href="{settings.FRONTEND_URL}/events" class="button">Ver Otros Eventos</a>
                    <div class="footer">
                        <p>Centro Cultural Banreservas</p>
                        <p>Si tienes alguna pregunta, contáctanos.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            from fastapi.responses import HTMLResponse
            return HTMLResponse(content=html_response, status_code=200)
            
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported invitation type"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        # Return user-friendly error page
        error_html = f"""
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error - Centro Cultural Banreservas</title>
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                    text-align: center;
                }}
                .container {{
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .error-icon {{
                    font-size: 48px;
                    color: #e74c3c;
                    margin-bottom: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="error-icon">⚠️</div>
                <h1>Error al procesar la invitación</h1>
                <p>Lo sentimos, ocurrió un error al procesar tu solicitud.</p>
                <p>Por favor, contacta al administrador si el problema persiste.</p>
            </div>
        </body>
        </html>
        """
        
        from fastapi.responses import HTMLResponse
        return HTMLResponse(content=error_html, status_code=500)


@router.post("/invitations/generate-decline-link")
async def generate_decline_link(
    invitation_data: dict
):
    """
    Generate a decline link for email invitations (Internal use)
    This is used by the email service to generate decline links
    """
    try:
        required_fields = ["invitation_type", "invitation_id", "user_email"]
        if not all(field in invitation_data for field in required_fields):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields"
            )
        
        # Generate the token
        token = generate_invitation_token(invitation_data)
        
        # Construct the decline link
        decline_link = f"{settings.API_URL}/api/invitations/decline?token={token}"
        
        return SuccessResponse(
            message="Decline link generated successfully",
            data={
                "decline_link": decline_link,
                "token": token,
                "expires_in": 24 * 60 * 60  # 24 hours in seconds
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate decline link"
        )


@router.get("/invitations/verify-token")
async def verify_invitation_token_endpoint(
    token: str = Query(..., description="Token to verify")
):
    """
    Verify if an invitation token is valid (for frontend validation)
    """
    try:
        payload = verify_invitation_token(token)
        
        return SuccessResponse(
            message="Token is valid",
            data={
                "valid": True,
                "expires_at": payload.get("exp"),
                "invitation_type": payload.get("invitation_type"),
                "user_email": payload.get("user_email")
            }
        )
        
    except HTTPException as e:
        return SuccessResponse(
            message="Token validation result",
            data={
                "valid": False,
                "error": e.detail
            }
        )
    except Exception as e:
        return SuccessResponse(
            message="Token validation result",
            data={
                "valid": False,
                "error": "Token verification failed"
            }
        )