#!/usr/bin/env python3
"""
Script para crear eventos de prueba con estructura compatible con el backend
"""

import sys
import os
import uuid
from datetime import datetime, timedelta
from pymongo import MongoClient

# Configuración de la base de datos
MONGO_URL = "mongodb://localhost:27017/cultural_center"

def clear_events():
    """Limpiar todos los eventos existentes"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        result = db.events.delete_many({})
        print(f"🗑️ Eliminados {result.deleted_count} eventos existentes")
        
    except Exception as e:
        print(f"❌ Error limpiando eventos: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

def create_compatible_events():
    """Crear eventos con la estructura que espera el backend"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        # Eventos con estructura compatible
        sample_events = [
            {
                "id": str(uuid.uuid4()),
                "title": "Estreno: Corazón Dominicano",
                "description": "Una película que explora las tradiciones y cultura dominicana.",
                "category": "Cinema Dominicano",
                "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                "time": "19:00",
                "capacity": 120,
                "location": "Sala Principal",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Ciclo Casablanca - Película Clásica",
                "description": "Disfruta de uno de los clásicos más importantes del cine mundial.",
                "category": "Cine Clásico",
                "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "time": "18:00",
                "capacity": 150,
                "location": "Auditorio Principal",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Avatar: El Camino del Agua",
                "description": "La esperada secuela de Avatar en una experiencia única.",
                "category": "Cine General",
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "time": "20:00",
                "capacity": 200,
                "location": "Sala IMAX",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Taller de Pintura al Óleo",
                "description": "Aprende técnicas básicas y avanzadas de pintura al óleo.",
                "category": "Talleres",
                "date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
                "time": "14:00",
                "capacity": 20,
                "location": "Sala de Arte",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Concierto de Jazz Latinoamericano",
                "description": "Una noche mágica con los mejores exponentes del jazz latino.",
                "category": "Conciertos",
                "date": (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d"),
                "time": "20:30",
                "capacity": 300,
                "location": "Teatro Principal",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Charla: El Futuro de la Inteligencia Artificial",
                "description": "Conferencia magistral sobre los avances y desafíos de la IA.",
                "category": "Charlas/Conferencias",
                "date": (datetime.now() + timedelta(days=12)).strftime("%Y-%m-%d"),
                "time": "19:00",
                "capacity": 180,
                "location": "Auditorio de Conferencias",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Exposición: Arte Contemporáneo Dominicano",
                "description": "Muestra colectiva de los artistas dominicanos más innovadores.",
                "category": "Exposiciones de Arte",
                "date": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d"),
                "time": "10:00",
                "capacity": 50,
                "location": "Galería Principal",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Experiencia VR: Viaje al Universo",
                "description": "Sumérgete en una experiencia 3D inmersiva para explorar galaxias.",
                "category": "Experiencias 3D Inmersivas",
                "date": (datetime.now() + timedelta(days=8)).strftime("%Y-%m-%d"),
                "time": "16:00",
                "capacity": 12,
                "location": "Sala VR",
                "image_url": None,
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        # Insertar eventos
        result = db.events.insert_many(sample_events)
        
        print(f"✅ Se crearon {len(result.inserted_ids)} eventos compatibles")
        print("🎭 Eventos listos para mostrar en la plataforma")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def main():
    print("🎭 Centro Cultural Banreservas - Setup de Eventos")
    print("=" * 60)
    
    print("🗑️ Limpiando eventos existentes...")
    clear_events()
    
    print("📅 Creando eventos compatibles...")
    success = create_compatible_events()
    
    if success:
        print("\n🎉 ¡Setup completado!")
        print("🌐 Ahora puedes ver los eventos en http://localhost:3000")
    else:
        print("\n❌ Hubo errores en el setup")

if __name__ == "__main__":
    main()
