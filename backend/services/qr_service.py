"""
QR Code generation service.
"""

import qrcode
import base64
from io import BytesIO
from PIL import Image
import string
import random
from typing import Optional

from backend.core.config import settings


class QRService:
    """Service for generating QR codes and check-in codes."""
    
    def __init__(self):
        self.qr_version = settings.QR_CODE_VERSION
        self.qr_box_size = settings.QR_CODE_BOX_SIZE
        self.qr_border = settings.QR_CODE_BORDER
    
    def generate_qr_code(self, data: str) -> str:
        """
        Generate a QR code optimized for mobile scanning.
        
        Args:
            data: Data to encode in the QR code
            
        Returns:
            Base64 encoded data URI of the QR code image
        """
        qr = qrcode.QRCode(
            version=self.qr_version,
            error_correction=qrcode.constants.ERROR_CORRECT_M,  # Better error correction
            box_size=self.qr_box_size,
            border=self.qr_border,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        # Create image with high contrast
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Ensure minimum size for mobile scanning
        if img.size[0] < 200:
            img = img.resize((200, 200), Image.NEAREST)
        
        # Convert to base64 data URI
        buffer = BytesIO()
        img.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)
        
        img_str = base64.b64encode(buffer.read()).decode()
        return f"data:image/png;base64,{img_str}"
    
    def generate_checkin_code(self, length: int = 8) -> str:
        """
        Generate unique alphanumeric check-in code.
        
        Args:
            length: Length of the code (default 8)
            
        Returns:
            Unique check-in code string
        """
        # Use uppercase letters and numbers for readability
        characters = string.ascii_uppercase + string.digits
        
        # Remove confusing characters (O, 0, I, 1, L)
        for char in ['O', '0', 'I', '1', 'L']:
            characters = characters.replace(char, '')
        
        # Generate random code
        code = ''.join(random.choice(characters) for _ in range(length))
        
        # Format with dashes for better readability (e.g., AB3D-5F7H)
        if length == 8:
            return f"{code[:4]}-{code[4:]}"
        
        return code
    
    def generate_reservation_qr(
        self, 
        reservation_id: str, 
        user_id: str, 
        event_id: str
    ) -> tuple[str, str]:
        """
        Generate QR code and check-in code for a reservation.
        
        Args:
            reservation_id: Reservation ID
            user_id: User ID
            event_id: Event ID
            
        Returns:
            Tuple of (qr_code_data_uri, checkin_code)
        """
        # Generate check-in code
        checkin_code = self.generate_checkin_code()
        
        # Create QR data with reservation info
        qr_data = f"RESERVATION:{reservation_id}|USER:{user_id}|EVENT:{event_id}|CODE:{checkin_code}"
        
        # Generate QR code
        qr_code_uri = self.generate_qr_code(qr_data)
        
        return qr_code_uri, checkin_code
    
    def parse_qr_data(self, qr_data: str) -> Optional[dict]:
        """
        Parse QR code data to extract reservation information.
        
        Args:
            qr_data: Raw QR code data string
            
        Returns:
            Dictionary with parsed data or None if invalid
        """
        try:
            # Expected format: RESERVATION:id|USER:id|EVENT:id|CODE:code
            parts = qr_data.split('|')
            
            if len(parts) != 4:
                return None
            
            data = {}
            for part in parts:
                key, value = part.split(':', 1)
                data[key.lower()] = value
            
            # Validate required fields
            required_fields = ['reservation', 'user', 'event', 'code']
            if all(field in data for field in required_fields):
                return data
            
            return None
            
        except Exception:
            return None
    
    def validate_checkin_code(self, code: str) -> str:
        """
        Validate and normalize a check-in code.
        
        Args:
            code: Check-in code to validate
            
        Returns:
            Normalized code (uppercase, no spaces or dashes)
        """
        # Remove spaces and dashes, convert to uppercase
        normalized = code.upper().replace(' ', '').replace('-', '')
        
        # Validate length and characters
        valid_chars = string.ascii_uppercase + string.digits
        for char in ['O', '0', 'I', '1', 'L']:
            valid_chars = valid_chars.replace(char, '')
        
        if len(normalized) == 8 and all(c in valid_chars for c in normalized):
            return normalized
        
        raise ValueError("Invalid check-in code format")


# Create singleton instance
qr_service = QRService()