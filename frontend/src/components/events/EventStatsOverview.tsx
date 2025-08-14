'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Ticket, 
  Activity, 
  TrendingUp,
  Users,
  Clock,
  MapPin,
  BarChart3
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useCurrentCenter } from '@/stores/centerStore';
import CenterSelector from '../CenterSelector';

interface EventStats {
  totalEvents: number;
  totalReservations: number;
  eventsInProgress: number;
  averageOccupancy: number;
  upcomingEvents: number;
  completedEvents: number;
}

interface EventStatsOverviewProps {
  className?: string;
}

export default function EventStatsOverview({ className = '' }: EventStatsOverviewProps) {
  const [stats, setStats] = useState<EventStats>({
    totalEvents: 0,
    totalReservations: 0,
    eventsInProgress: 0,
    averageOccupancy: 0,
    upcomingEvents: 0,
    completedEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const { currentCenter, centerInfo } = useCurrentCenter();

  useEffect(() => {
    loadStats();
  }, [currentCenter]); // Recargar estadísticas cuando cambie el centro

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Obtener eventos y calcular estadísticas
      const events = await apiService.getEvents();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calcular estadísticas básicas
      const totalEvents = events.length;
      const upcomingEvents = events.filter(event => new Date(event.date) >= today).length;
      const completedEvents = totalEvents - upcomingEvents;
      
      // Eventos en progreso (hoy)
      const eventsInProgress = events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      }).length;

      // Calcular ocupación promedio
      let totalOccupancy = 0;
      let eventsWithCapacity = 0;
      
      events.forEach(event => {
        if (event.capacity > 0) {
          const attendees = event.capacity - (event.available_spots || 0);
          const occupancy = (attendees / event.capacity) * 100;
          totalOccupancy += occupancy;
          eventsWithCapacity++;
        }
      });

      const averageOccupancy = eventsWithCapacity > 0 ? totalOccupancy / eventsWithCapacity : 0;
      
      // Total de reservas (simulado basado en ocupación)
      const totalReservations = events.reduce((total, event) => {
        return total + (event.capacity - (event.available_spots || 0));
      }, 0);

      setStats({
        totalEvents,
        totalReservations,
        eventsInProgress,
        averageOccupancy: Math.round(averageOccupancy),
        upcomingEvents,
        completedEvents
      });
    } catch (error) {
      console.error('Error loading event stats:', error);
      // Mantener stats en 0 si hay error
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Eventos Totales',
      value: stats.totalEvents,
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      description: `${stats.upcomingEvents} próximos`
    },
    {
      title: 'Reservas Totales',
      value: stats.totalReservations,
      icon: Ticket,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      description: 'Todas las reservas'
    },
    {
      title: 'En Progreso',
      value: stats.eventsInProgress,
      icon: Activity,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      description: 'Eventos hoy'
    },
    {
      title: 'Ocupación Promedio',
      value: `${stats.averageOccupancy}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      description: 'Capacidad ocupada'
    }
  ];

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estadísticas de Eventos</h2>
          <div className="flex items-center space-x-2 mt-1">
            <CenterSelector showFullInfo={false} />
            <span className="text-gray-400">•</span>
            <p className="text-gray-600 text-sm">Resumen de la actividad en tiempo real</p>
          </div>
        </div>
        <button 
          onClick={loadStats}
          className="p-2 text-gray-400 hover:text-ccb-blue transition-colors rounded-lg hover:bg-gray-50"
          title="Actualizar estadísticas"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${card.bgColor} rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${card.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`text-2xl font-bold ${card.textColor}`}>
                  {typeof card.value === 'number' && card.value > 999 
                    ? `${Math.floor(card.value / 1000)}k+` 
                    : card.value
                  }
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 text-sm mb-1">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {card.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Mini gráfico de tendencia */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            📊 {stats.completedEvents} eventos completados • {stats.upcomingEvents} próximos
          </span>
          <span className="text-ccb-blue font-medium">
            Ver analytics completo →
          </span>
        </div>
      </div>
    </motion.div>
  );
}