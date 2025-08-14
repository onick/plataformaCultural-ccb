#!/usr/bin/env python3
"""
Script para gestionar usuarios administradores del Centro Cultural Banreservas
"""

import sys
import os
import uuid
from datetime import datetime
import bcrypt
from pymongo import MongoClient

# Configuración de la base de datos
MONGO_URL = "mongodb://localhost:27017/cultural_center"

def hash_password(password: str) -> str:
    """Hash a password with bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_admin_user(name: str, email: str, password: str, phone: str = None):
    """Crear un nuevo usuario administrador"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        # Verificar si el email ya existe
        existing_user = db.users.find_one({"email": email})
        if existing_user:
            print(f"❌ Error: Ya existe un usuario con el email {email}")
            return False
        
        # Crear el usuario administrador
        admin_id = str(uuid.uuid4())
        hashed_password = hash_password(password)
        
        admin_doc = {
            "id": admin_id,
            "name": name,
            "email": email,
            "password": hashed_password,
            "phone": phone or "N/A",
            "age": 30,
            "location": "Centro Cultural Banreservas",
            "is_admin": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = db.users.insert_one(admin_doc)
        
        if result.inserted_id:
            print(f"✅ Usuario administrador creado exitosamente:")
            print(f"   📧 Email: {email}")
            print(f"   👤 Nombre: {name}")
            print(f"   🔑 Contraseña: {password}")
            print(f"   🆔 ID: {admin_id}")
            return True
        else:
            print("❌ Error al crear el usuario administrador")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def list_admin_users():
    """Listar todos los usuarios administradores"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        admins = list(db.users.find({"is_admin": True}))
        
        if not admins:
            print("📋 No hay usuarios administradores en el sistema")
            return
        
        print(f"📋 Usuarios Administradores ({len(admins)}):")
        print("-" * 60)
        
        for admin in admins:
            print(f"👤 {admin.get('name', 'N/A')}")
            print(f"   📧 Email: {admin.get('email', 'N/A')}")
            print(f"   📱 Teléfono: {admin.get('phone', 'N/A')}")
            print(f"   📅 Creado: {admin.get('created_at', 'N/A')}")
            print(f"   🆔 ID: {admin.get('id', 'N/A')}")
            print("-" * 60)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

def create_default_admin():
    """Crear el usuario administrador por defecto"""
    return create_admin_user(
        name="Administrador CCB",
        email="admin@banreservas.com.do",
        password="Admin2024CCB!",
        phone="+1-809-960-2121"
    )

def main():
    print("🎭 Centro Cultural Banreservas - Gestión de Administradores")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python admin_manager.py list                    # Listar administradores")
        print("  python admin_manager.py create-default          # Crear admin por defecto")
        print("  python admin_manager.py create <nombre> <email> <password> [teléfono]")
        return
    
    command = sys.argv[1]
    
    if command == "list":
        list_admin_users()
    
    elif command == "create-default":
        print("Creando usuario administrador por defecto...")
        create_default_admin()
    
    elif command == "create":
        if len(sys.argv) < 5:
            print("❌ Error: Faltan parámetros")
            print("Uso: python admin_manager.py create <nombre> <email> <password> [teléfono]")
            return
        
        name = sys.argv[2]
        email = sys.argv[3]
        password = sys.argv[4]
        phone = sys.argv[5] if len(sys.argv) > 5 else None
        
        create_admin_user(name, email, password, phone)
    
    else:
        print(f"❌ Comando desconocido: {command}")

if __name__ == "__main__":
    main()
