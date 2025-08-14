#!/usr/bin/env python3
"""
Script para crear eventos de prueba en el Centro Cultural Banreservas
"""

import sys
import os
import uuid
from datetime import datetime, timedelta
from pymongo import MongoClient

# Configuración de la base de datos
MONGO_URL = "mongodb://localhost:27017/cultural_center"

def create_sample_events():
    """Crear eventos de prueba para la plataforma"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        # Verificar si ya existen eventos
        existing_events = db.events.count_documents({})
        if existing_events > 0:
            print(f"📅 Ya existen {existing_events} eventos en la base de datos")
            choice = input("¿Deseas agregar más eventos de prueba? (y/n): ")
            if choice.lower() != 'y':
                return
        
        # Eventos de prueba con las 8 categorías
        sample_events = [
            {
                "titulo": "Estreno: Corazón Dominicano",
                "descripcion": "Una película que explora las tradiciones y cultura dominicana a través de historias íntimas y conmovedoras.",
                "categoria": "Cinema Dominicano",
                "fecha_inicio": (datetime.now() + timedelta(days=7)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=7)).isoformat(),
                "hora_inicio": "19:00",
                "hora_fin": "21:30",
                "capacidad_maxima": 120,
                "reservas_actuales": 45,
                "ubicacion": "Sala Principal",
                "precio": 300.00,
                "es_gratuito": False,
                "estado": "activo"
            },
            {
                "titulo": "Ciclo Casablanca - Película Clásica",
                "descripcion": "Disfruta de uno de los clásicos más importantes del cine mundial en pantalla grande.",
                "categoria": "Cine Clásico",
                "fecha_inicio": (datetime.now() + timedelta(days=5)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=5)).isoformat(),
                "hora_inicio": "18:00",
                "hora_fin": "20:15",
                "capacidad_maxima": 150,
                "reservas_actuales": 78,
                "ubicacion": "Auditorio Principal",
                "precio": 0.00,
                "es_gratuito": True,
                "estado": "activo"
            },
            {
                "titulo": "Avatar: El Camino del Agua",
                "descripcion": "La esperada secuela de Avatar en una experiencia cinematográfica única.",
                "categoria": "Cine General",
                "fecha_inicio": (datetime.now() + timedelta(days=3)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=3)).isoformat(),
                "hora_inicio": "20:00",
                "hora_fin": "23:15",
                "capacidad_maxima": 200,
                "reservas_actuales": 156,
                "ubicacion": "Sala IMAX",
                "precio": 450.00,
                "es_gratuito": False,
                "estado": "activo"
            },
            {
                "titulo": "Taller de Pintura al Óleo",
                "descripcion": "Aprende técnicas básicas y avanzadas de pintura al óleo con artistas profesionales.",
                "categoria": "Talleres",
                "fecha_inicio": (datetime.now() + timedelta(days=10)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=10)).isoformat(),
                "hora_inicio": "14:00",
                "hora_fin": "17:00",
                "capacidad_maxima": 20,
                "reservas_actuales": 8,
                "ubicacion": "Sala de Arte",
                "precio": 850.00,
                "es_gratuito": False,
                "estado": "activo"
            },
            {
                "titulo": "Concierto de Jazz Latinoamericano",
                "descripcion": "Una noche mágica con los mejores exponentes del jazz latinoamericano.",
                "categoria": "Conciertos",
                "fecha_inicio": (datetime.now() + timedelta(days=15)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=15)).isoformat(),
                "hora_inicio": "20:30",
                "hora_fin": "22:30",
                "capacidad_maxima": 300,
                "reservas_actuales": 234,
                "ubicacion": "Teatro Principal",
                "precio": 1200.00,
                "es_gratuito": False,
                "estado": "activo"
            },
            {
                "titulo": "Charla: El Futuro de la Inteligencia Artificial",
                "descripcion": "Conferencia magistral sobre los avances y desafíos de la IA en el siglo XXI.",
                "categoria": "Charlas/Conferencias",
                "fecha_inicio": (datetime.now() + timedelta(days=12)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=12)).isoformat(),
                "hora_inicio": "19:00",
                "hora_fin": "21:00",
                "capacidad_maxima": 180,
                "reservas_actuales": 67,
                "ubicacion": "Auditorio de Conferencias",
                "precio": 0.00,
                "es_gratuito": True,
                "estado": "activo"
            },
            {
                "titulo": "Exposición: Arte Contemporáneo Dominicano",
                "descripcion": "Muestra colectiva de los artistas dominicanos más innovadores de la actualidad.",
                "categoria": "Exposiciones de Arte",
                "fecha_inicio": (datetime.now() + timedelta(days=2)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=30)).isoformat(),
                "hora_inicio": "10:00",
                "hora_fin": "18:00",
                "capacidad_maxima": 50,
                "reservas_actuales": 23,
                "ubicacion": "Galería Principal",
                "precio": 200.00,
                "es_gratuito": False,
                "estado": "activo"
            },
            {
                "titulo": "Experiencia VR: Viaje al Universo",
                "descripcion": "Sumérgete en una experiencia 3D inmersiva que te llevará a explorar galaxias lejanas.",
                "categoria": "Experiencias 3D Inmersivas",
                "fecha_inicio": (datetime.now() + timedelta(days=8)).isoformat(),
                "fecha_fin": (datetime.now() + timedelta(days=8)).isoformat(),
                "hora_inicio": "16:00",
                "hora_fin": "17:30",
                "capacidad_maxima": 12,
                "reservas_actuales": 9,
                "ubicacion": "Sala VR",
                "precio": 600.00,
                "es_gratuito": False,
                "estado": "activo"
            }
        ]
        
        # Insertar eventos
        inserted_count = 0
        for event_data in sample_events:
            event_id = str(uuid.uuid4())
            event_doc = {
                "id": event_id,
                **event_data,
                "requiere_reserva": True,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            result = db.events.insert_one(event_doc)
            if result.inserted_id:
                inserted_count += 1
                print(f"✅ Evento creado: {event_data['titulo']}")
        
        print(f"\n🎭 ¡Éxito! Se crearon {inserted_count} eventos de prueba")
        print("📅 La plataforma ahora tiene contenido para mostrar")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

def list_events():
    """Listar todos los eventos existentes"""
    try:
        client = MongoClient(MONGO_URL)
        db = client.cultural_center
        
        events = list(db.events.find({}))
        
        if not events:
            print("📋 No hay eventos en la base de datos")
            return
        
        print(f"📅 Eventos en la base de datos ({len(events)}):")
        print("-" * 70)
        
        for event in events:
            print(f"🎭 {event.get('titulo', 'Sin título')}")
            print(f"   📂 Categoría: {event.get('categoria', 'N/A')}")
            print(f"   📅 Fecha: {event.get('fecha_inicio', 'N/A')}")
            print(f"   👥 Reservas: {event.get('reservas_actuales', 0)}/{event.get('capacidad_maxima', 0)}")
            print(f"   🏢 Ubicación: {event.get('ubicacion', 'N/A')}")
            print("-" * 70)
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        if 'client' in locals():
            client.close()

def main():
    print("🎭 Centro Cultural Banreservas - Gestión de Eventos")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("Uso:")
        print("  python events_manager.py create     # Crear eventos de prueba")
        print("  python events_manager.py list       # Listar eventos existentes")
        return
    
    command = sys.argv[1]
    
    if command == "create":
        print("Creando eventos de prueba...")
        create_sample_events()
    
    elif command == "list":
        list_events()
    
    else:
        print(f"❌ Comando desconocido: {command}")

if __name__ == "__main__":
    main()
