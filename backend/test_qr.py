#!/usr/bin/env python3
"""
Script de prueba para verificar generación de códigos QR
"""

import qrcode
import base64
from io import BytesIO
import uuid

def generate_test_qr_code(data: str) -> str:
    """Genera un código QR de prueba"""
    print(f"📋 Generando QR con datos: '{data}'")
    
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,  # Usar corrección de error baja para tamaño menor
        box_size=10,
        border=4,  # Reducir el borde
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    # Crear imagen
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Mostrar información del QR
    print(f"📊 Versión del QR: {qr.version}")
    print(f"📏 Tamaño de la matriz: {qr.modules_count}x{qr.modules_count}")
    print(f"📦 Datos almacenados: {len(data)} caracteres")
    
    # Convertir a base64
    buffer = BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    
    img_str = base64.b64encode(buffer.read()).decode()
    data_url = f"data:image/png;base64,{img_str}"
    
    print(f"✅ QR generado exitosamente")
    print(f"📄 Tamaño del base64: {len(img_str)} caracteres")
    print(f"🔗 Data URL length: {len(data_url)} caracteres")
    
    return data_url

def test_different_formats():
    """Prueba diferentes formatos de datos en QR"""
    
    print("🧪 === PRUEBA DE CÓDIGOS QR ===\n")
    
    # Generar un ID de reserva de ejemplo
    test_reservation_id = str(uuid.uuid4())
    print(f"🎯 ID de reserva de ejemplo: {test_reservation_id}\n")
    
    # Formato 1: Formato actual del sistema
    print("1️⃣ FORMATO ACTUAL DEL SISTEMA:")
    qr_data_1 = f"reservation:{test_reservation_id}"
    qr_code_1 = generate_test_qr_code(qr_data_1)
    
    print("\n" + "="*50 + "\n")
    
    # Formato 2: Solo el ID
    print("2️⃣ FORMATO SOLO ID:")
    qr_data_2 = test_reservation_id
    qr_code_2 = generate_test_qr_code(qr_data_2)
    
    print("\n" + "="*50 + "\n")
    
    # Formato 3: URL completa
    print("3️⃣ FORMATO URL COMPLETA:")
    qr_data_3 = f"https://culturalcenter.com/checkin?reservation={test_reservation_id}"
    qr_code_3 = generate_test_qr_code(qr_data_3)
    
    print("\n" + "="*50 + "\n")
    
    # Formato 4: JSON simple
    print("4️⃣ FORMATO JSON:")
    qr_data_4 = f'{{"type":"reservation","id":"{test_reservation_id}"}}'
    qr_code_4 = generate_test_qr_code(qr_data_4)
    
    print("\n" + "="*50 + "\n")
    
    # Verificar que todos sean diferentes
    formats = [
        ("Formato actual", qr_data_1),
        ("Solo ID", qr_data_2), 
        ("URL completa", qr_data_3),
        ("JSON", qr_data_4)
    ]
    
    print("📋 RESUMEN DE FORMATOS GENERADOS:")
    for name, data in formats:
        print(f"  • {name}: '{data}'")
    
    print(f"\n🔍 RECOMENDACIÓN:")
    print(f"  El formato actual 'reservation:{test_reservation_id}' es válido.")
    print(f"  Si el QR no funciona, puede ser un problema con:")
    print(f"  - La aplicación de escaneo del teléfono")
    print(f"  - La calidad de la imagen del QR")
    print(f"  - El tamaño del QR en pantalla")
    
    # Guardar un QR de prueba como archivo
    print(f"\n💾 Guardando QR de prueba...")
    
    # Generar QR simple para prueba
    simple_qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    simple_qr.add_data(qr_data_1)
    simple_qr.make(fit=True)
    
    img = simple_qr.make_image(fill_color="black", back_color="white")
    img.save("test_qr_code.png")
    print(f"✅ QR guardado como 'test_qr_code.png'")
    print(f"   Puedes probar escaneando este archivo directamente")

if __name__ == "__main__":
    test_different_formats() 