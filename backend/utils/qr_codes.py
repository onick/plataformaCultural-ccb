"""
QR Code generation utilities
"""

import qrcode
import base64
import random
import string
from io import BytesIO
from typing import Tuple, Optional
from PIL import Image
from core.config import settings


def generate_reservation_code() -> str:
    """Generate a unique 8-character reservation code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


def generate_qr_code(data: str, size: int = None, border: int = None) -> str:
    """Generate QR code and return as base64 encoded string"""
    try:
        # Use config values or defaults
        qr_size = size or settings.QR_CODE_SIZE
        qr_border = border or settings.QR_CODE_BORDER
        
        # Create QR code instance
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=qr_size,
            border=qr_border,
        )
        
        # Add data and make QR code
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        # Encode to base64
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return qr_base64
        
    except Exception as e:
        raise Exception(f"Failed to generate QR code: {e}")


def generate_reservation_qr_code(reservation_id: str, reservation_code: str) -> str:
    """Generate QR code specifically for reservations"""
    qr_data = f"CCB-RESERVATION:{reservation_id}:{reservation_code}"
    return generate_qr_code(qr_data)


def generate_event_qr_code(event_id: str, event_title: str) -> str:
    """Generate QR code for events"""
    qr_data = f"CCB-EVENT:{event_id}:{event_title}"
    return generate_qr_code(qr_data)


def generate_check_in_qr_code(
    reservation_id: str, 
    event_id: str, 
    user_id: str
) -> str:
    """Generate QR code for check-in process"""
    qr_data = f"CCB-CHECKIN:{reservation_id}:{event_id}:{user_id}"
    return generate_qr_code(qr_data)


def decode_qr_data(qr_data: str) -> Optional[dict]:
    """Decode QR code data and return structured information"""
    try:
        if not qr_data.startswith("CCB-"):
            return None
        
        parts = qr_data.split(":")
        if len(parts) < 2:
            return None
        
        qr_type = parts[0].replace("CCB-", "")
        
        if qr_type == "RESERVATION" and len(parts) >= 3:
            return {
                "type": "reservation",
                "reservation_id": parts[1],
                "reservation_code": parts[2]
            }
        
        elif qr_type == "EVENT" and len(parts) >= 3:
            return {
                "type": "event",
                "event_id": parts[1],
                "event_title": parts[2]
            }
        
        elif qr_type == "CHECKIN" and len(parts) >= 4:
            return {
                "type": "checkin",
                "reservation_id": parts[1],
                "event_id": parts[2],
                "user_id": parts[3]
            }
        
        return None
        
    except Exception:
        return None


def create_branded_qr_code(data: str, logo_path: Optional[str] = None) -> str:
    """Create a branded QR code with optional logo"""
    try:
        # Generate base QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,  # High error correction for logo
            box_size=10,
            border=4,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create QR code image
        qr_img = qr.make_image(fill_color="#003087", back_color="white")
        
        # If logo is provided, add it to the center
        if logo_path:
            try:
                logo = Image.open(logo_path)
                
                # Calculate logo size (about 10% of QR code)
                qr_width, qr_height = qr_img.size
                logo_size = min(qr_width, qr_height) // 10
                
                # Resize logo
                logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
                
                # Calculate position to center logo
                logo_pos = (
                    (qr_width - logo_size) // 2,
                    (qr_height - logo_size) // 2
                )
                
                # Paste logo onto QR code
                qr_img.paste(logo, logo_pos)
                
            except Exception as logo_error:
                # If logo fails, continue without it
                pass
        
        # Convert to base64
        buffer = BytesIO()
        qr_img.save(buffer, format='PNG')
        buffer.seek(0)
        
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()
        return qr_base64
        
    except Exception as e:
        # Fallback to regular QR code
        return generate_qr_code(data)


def validate_qr_code_data(qr_data: str) -> bool:
    """Validate if QR code data is in correct format"""
    decoded = decode_qr_data(qr_data)
    return decoded is not None


def generate_batch_qr_codes(items: list, qr_type: str) -> list:
    """Generate multiple QR codes in batch"""
    qr_codes = []
    
    for item in items:
        try:
            if qr_type == "reservation":
                qr_data = f"CCB-RESERVATION:{item['id']}:{item['code']}"
            elif qr_type == "event":
                qr_data = f"CCB-EVENT:{item['id']}:{item['title']}"
            else:
                continue
            
            qr_base64 = generate_qr_code(qr_data)
            qr_codes.append({
                "id": item["id"],
                "qr_code": qr_base64,
                "data": qr_data
            })
            
        except Exception as e:
            # Skip failed QR codes
            continue
    
    return qr_codes
