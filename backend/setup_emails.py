#!/usr/bin/env python3
"""
Script para configurar y probar el sistema de emails del Centro Cultural
"""

import os
import sys
from pathlib import Path

def create_env_file():
    """Crea archivo .env con configuración de emails"""
    
    print("🔧 Configuración del Sistema de Emails - Centro Cultural Banreservas\n")
    
    # Obtener API Key
    print("📧 Necesitas configurar SendGrid para enviar emails automáticamente.")
    print("🌐 Ve a: https://sendgrid.com → 'Start for Free' → Crear cuenta")
    print("⚙️  En SendGrid: Settings → API Keys → Create API Key\n")
    
    api_key = input("Pega tu SendGrid API Key aquí: ").strip()
    
    if not api_key:
        print("❌ API Key no proporcionada. Saliendo...")
        return False
    
    if not api_key.startswith('SG.'):
        print("⚠️  La API Key debería empezar con 'SG.' - ¿estás seguro? (Continuando...)")
    
    # Obtener email
    from_email = input("\n📤 Email remitente (ej: admin@culturalcenter.com): ").strip()
    
    if not from_email:
        from_email = "noreply@culturalcenter.com"
        print(f"✅ Usando email por defecto: {from_email}")
    
    # Crear archivo .env
    env_content = f"""# SendGrid Email Configuration
SENDGRID_API_KEY={api_key}
FROM_EMAIL={from_email}

# Database Configuration
MONGO_URL=mongodb://localhost:27017/
SECRET_KEY=your-secret-key-change-in-production-{os.urandom(8).hex()}
"""
    
    env_path = Path(__file__).parent / '.env'
    
    try:
        with open(env_path, 'w') as f:
            f.write(env_content)
        
        print(f"\n✅ Archivo .env creado en: {env_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error creando .env: {e}")
        return False

def test_email_system():
    """Prueba el sistema de emails"""
    
    print("\n🧪 Probando el sistema de emails...")
    
    try:
        # Cargar variables de entorno
        from dotenv import load_dotenv
        load_dotenv()
        
        # Importar función de email
        from server import send_email
        
        # Email de prueba
        test_email = input("\n📧 Email para prueba (ej: tu-email@gmail.com): ").strip()
        
        if not test_email:
            print("❌ Email de prueba no proporcionado.")
            return False
        
        # Enviar email de prueba
        subject = "🎉 Sistema de Emails Funcionando - Centro Cultural"
        html_content = """
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #10b981;">¡Sistema de Emails Configurado!</h2>
                <p>Este es un email de prueba del Centro Cultural Banreservas.</p>
                <p><strong>✅ Tu sistema de emails está funcionando correctamente.</strong></p>
                <p>Ahora los usuarios recibirán automáticamente:</p>
                <ul>
                    <li>Emails de bienvenida al registrarse</li>
                    <li>Confirmaciones de reserva con códigos</li>
                    <li>Confirmaciones de check-in</li>
                    <li>Notificaciones de cancelación</li>
                </ul>
                <p style="color: #666;">Plataforma Centro Cultural Banreservas</p>
            </body>
        </html>
        """
        
        result = send_email(test_email, subject, html_content)
        
        if result:
            print(f"\n🎉 ¡Email de prueba enviado exitosamente a {test_email}!")
            print("📱 Revisa tu bandeja de entrada (puede tardar unos minutos)")
            print("✅ El sistema de emails está funcionando correctamente")
            return True
        else:
            print(f"\n❌ Error enviando email de prueba")
            print("🔍 Revisa los logs del servidor para más detalles")
            return False
            
    except ImportError as e:
        print(f"\n❌ Error importando módulos: {e}")
        print("💡 Asegúrate de estar en la carpeta backend y tener las dependencias instaladas")
        return False
    except Exception as e:
        print(f"\n❌ Error en prueba de email: {e}")
        return False

def main():
    """Función principal"""
    
    print("🏛️  Centro Cultural Banreservas - Configurador de Emails\n")
    
    # Verificar que estamos en la carpeta correcta
    if not Path('server.py').exists():
        print("❌ Ejecuta este script desde la carpeta 'backend'")
        print("💡 Comando: cd backend && python3.11 setup_emails.py")
        return
    
    while True:
        print("\n" + "="*50)
        print("Opciones:")
        print("1. 🔧 Configurar variables de entorno (.env)")
        print("2. 🧪 Probar sistema de emails")
        print("3. 📧 Ver estado actual")
        print("4. 🚪 Salir")
        print("="*50)
        
        choice = input("\nElige una opción (1-4): ").strip()
        
        if choice == '1':
            create_env_file()
            
        elif choice == '2':
            test_email_system()
            
        elif choice == '3':
            # Mostrar estado actual
            env_path = Path('.env')
            print(f"\n📁 Archivo .env: {'✅ Existe' if env_path.exists() else '❌ No existe'}")
            
            api_key = os.environ.get('SENDGRID_API_KEY')
            from_email = os.environ.get('FROM_EMAIL')
            
            print(f"🔑 SENDGRID_API_KEY: {'✅ Configurada' if api_key else '❌ No configurada'}")
            print(f"📤 FROM_EMAIL: {from_email if from_email else '❌ No configurado'}")
            
            if env_path.exists():
                print(f"\n📄 Contenido de .env:")
                with open(env_path, 'r') as f:
                    content = f.read()
                    # Ocultar API key por seguridad
                    safe_content = content.replace(api_key if api_key else '', 'SG.***OCULTA***') if api_key else content
                    print(safe_content)
        
        elif choice == '4':
            print("\n👋 ¡Hasta luego! El sistema de emails estará listo una vez configurado.")
            break
            
        else:
            print("❌ Opción inválida. Elige 1, 2, 3 o 4.")

if __name__ == "__main__":
    main() 