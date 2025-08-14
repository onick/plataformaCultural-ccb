'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  Eye,
  UserCheck,
  TrendingUp,
  Star,
  ChevronRight
} from 'lucide-react';
import { Event } from '@/types';
import { apiService } from '@/services/api';
import { formatEventDate, calculateOccupancy } from '@/utils/eventUtils';

interface FeaturedEventsSectionProps {
  className?: string;
}

interface FeaturedEventCardProps {
  event: Event;
  priority: 'high' | 'medium' | 'low';
}

function FeaturedEventCard({ event, priority }: FeaturedEventCardProps) {
  const occupancyPercentage = calculateOccupancy(event.capacity, event.available_spots || 0);
  const attendees = event.capacity - (event.available_spots || 0);
  const isToday = new Date(event.date).toDateString() === new Date().toDateString();
  const isUpcoming = new Date(event.date) > new Date();

  const priorityConfig = {
    high: {
      border: 'border-red-200',
      bg: 'bg-gradient-to-br from-red-50 to-orange-50',
      badge: 'bg-red-100 text-red-700 border-red-200',
      badgeText: '🔥 Prioridad Alta'
    },
    medium: {
      border: 'border-blue-200',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      badgeText: '⭐ Destacado'
    },
    low: {
      border: 'border-green-200',
      bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
      badge: 'bg-green-100 text-green-700 border-green-200',
      badgeText: '📌 Próximo'
    }
  };

  const config = priorityConfig[priority];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className={`${config.bg} ${config.border} border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-300 min-w-[280px] max-w-[320px]`}
    >
      {/* Header con imagen y badge */}
      <div className="relative mb-4">
        <div className="h-32 bg-gradient-to-r from-ccb-blue to-ccb-lightblue rounded-lg flex items-center justify-center mb-3">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Calendar className="w-12 h-12 text-white opacity-80" />
          )}
        </div>
        
        <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full border ${config.badge}`}>
          {config.badgeText}
        </div>
        
        {isToday && (
          <div className="absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200">
            📅 Hoy
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
            {event.title}
          </h3>
          <span className="inline-block px-2 py-1 text-xs font-medium bg-white/80 text-gray-700 rounded-full border">
            {event.category}
          </span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2">
          {event.description}
        </p>

        {/* Detalles del evento */}
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-700">
            <Calendar className="w-4 h-4 mr-2 text-ccb-blue" />
            <span className="font-medium">{formatEventDate(event.date)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            <span>{event.time}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Estadísticas de ocupación */}
        <div className="bg-white/60 rounded-lg p-3 border border-white/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm text-gray-700">
              <Users className="w-4 h-4 mr-2" />
              <span className="font-medium">{attendees}/{event.capacity}</span>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              occupancyPercentage >= 80 ? 'bg-red-100 text-red-700' :
              occupancyPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {occupancyPercentage.toFixed(0)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue h-2 rounded-full transition-all duration-300"
              style={{ width: `${occupancyPercentage}%` }}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex space-x-2 pt-2">
          <Link 
            href={`/admin/events/${event.id}`}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-white text-ccb-blue border border-ccb-blue rounded-lg hover:bg-ccb-blue hover:text-white transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Link>
          
          {isUpcoming && (
            <Link 
              href={`/admin/checkin?event=${event.id}`}
              className="flex-1 flex items-center justify-center px-3 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors text-sm font-medium"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Check-in
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function FeaturedEventsSection({ className = '' }: FeaturedEventsSectionProps) {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedEvents();
  }, []);

  const loadFeaturedEvents = async () => {
    try {
      setLoading(true);
      const events = await apiService.getEvents();
      
      // Filtrar y priorizar eventos
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Lógica de priorización:
      // 1. Eventos de hoy (alta prioridad)
      // 2. Eventos próximos con alta ocupación (media prioridad) 
      // 3. Eventos próximos en general (baja prioridad)
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === today.toDateString();
      });

      const upcomingHighOccupancy = events.filter(event => {
        const eventDate = new Date(event.date);
        const occupancy = calculateOccupancy(event.capacity, event.available_spots || 0);
        return eventDate > today && eventDate <= nextWeek && occupancy >= 70;
      });

      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate > today && eventDate <= nextWeek;
      }).slice(0, 2);

      // Combinar eventos destacados (máximo 4)
      const featured = [
        ...todayEvents.slice(0, 2),
        ...upcomingHighOccupancy.slice(0, 1),
        ...upcomingEvents.slice(0, 1)
      ].slice(0, 4);

      setFeaturedEvents(featured);
    } catch (error) {
      console.error('Error loading featured events:', error);
      setFeaturedEvents([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
        </div>
        
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredEvents.length === 0) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay eventos destacados
          </h3>
          <p className="text-gray-500">
            Los eventos próximos y relevantes aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  // Asignar prioridades a los eventos
  const eventsWithPriority = featuredEvents.map((event, index) => {
    const isToday = new Date(event.date).toDateString() === new Date().toDateString();
    const occupancy = calculateOccupancy(event.capacity, event.available_spots || 0);
    
    let priority: 'high' | 'medium' | 'low' = 'low';
    
    if (isToday) {
      priority = 'high';
    } else if (occupancy >= 70) {
      priority = 'medium';
    }
    
    return { event, priority };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Eventos Destacados</h2>
          <p className="text-gray-600 text-sm">Eventos prioritarios y próximos</p>
        </div>
        
        <Link 
          href="/admin/events/calendar"
          className="flex items-center text-sm text-ccb-blue hover:text-ccb-blue/80 transition-colors font-medium"
        >
          Ver calendario
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="flex space-x-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {eventsWithPriority.map(({ event, priority }, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FeaturedEventCard event={event} priority={priority} />
          </motion.div>
        ))}
      </div>

      {/* Indicador de scroll si hay overflow */}
      {featuredEvents.length > 3 && (
        <div className="flex justify-center mt-4">
          <div className="flex space-x-2">
            {featuredEvents.map((_, index) => (
              <div 
                key={index}
                className="w-2 h-2 rounded-full bg-gray-300"
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}