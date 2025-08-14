#!/usr/bin/env python3
"""
Script para migrar códigos QR existentes al nuevo formato URL
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
import qrcode
import base64
from io import BytesIO
from PIL import Image

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client.cultural_center

def generate_new_qr_code(reservation_id: str) -> str:
    """
    Genera un código QR con el nuevo formato URL
    """
    qr_data = f"https://ccb.checkin.app/verify/{reservation_id}"
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=12,
        border=4,
    )
    qr.add_data(qr_data)
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

def migrate_qr_codes():
    """Migra todos los códigos QR al nuevo formato"""
    print("🔄 Iniciando migración de códigos QR al nuevo formato...")
    
    # Buscar todas las reservas
    reservations = list(db.reservations.find({}))
    
    print(f"📊 Encontradas {len(reservations)} reservas para procesar")
    
    migrated_count = 0
    skipped_count = 0
    
    for reservation in reservations:
        reservation_id = reservation.get("id")
        current_qr = reservation.get("qr_code", "")
        
        if not reservation_id:
            print(f"⚠️ Reserva sin ID encontrada, saltando...")
            skipped_count += 1
            continue
        
        # Verificar si ya tiene el nuevo formato
        if "ccb.checkin.app" in current_qr:
            print(f"✅ Reserva {reservation_id[:8]}... ya tiene el nuevo formato")
            skipped_count += 1
            continue
        
        try:
            # Generar nuevo QR
            new_qr_code = generate_new_qr_code(reservation_id)
            
            # Actualizar en la base de datos
            result = db.reservations.update_one(
                {"_id": reservation["_id"]},
                {"$set": {"qr_code": new_qr_code}}
            )
            
            if result.modified_count > 0:
                migrated_count += 1
                print(f"🔄 Migrada reserva {reservation_id[:8]}... al nuevo formato URL")
            else:
                print(f"❌ Error al actualizar reserva {reservation_id[:8]}...")
                
        except Exception as e:
            print(f"❌ Error procesando reserva {reservation_id[:8]}...: {str(e)}")
            skipped_count += 1
    
    print(f"\n✅ Migración completada!")
    print(f"📈 Reservas migradas: {migrated_count}")
    print(f"⏭️ Reservas omitidas: {skipped_count}")
    print(f"📊 Total procesadas: {migrated_count + skipped_count}")
    
    if migrated_count > 0:
        print(f"\n🎉 Todos los códigos QR ahora usan el formato URL mejorado!")
        print(f"🔗 Nuevo formato: https://ccb.checkin.app/verify/[ID]")
        print(f"📱 Esto debería resolver los problemas de 'no se encontraron datos utilizables'")

if __name__ == "__main__":
    migrate_qr_codes() 