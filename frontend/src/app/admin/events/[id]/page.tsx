'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Image,
  Tag,
  Edit,
  ArrowLeft,
  Download,
  Share,
  QrCode,
  Settings,
  Activity,
  DollarSign,
  Mail,
  Phone,
  UserCheck,
  List
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Event } from '@/types';
import { apiService } from '@/services/api';
import { formatEventDate, calculateOccupancy, getOccupancyColor } from '@/utils/eventUtils';
import EventAttendees from '@/components/events/EventAttendees';

interface EventDetailPageProps {
  params: {
    id: string;
  };
}

type TabType = 'details' | 'attendees';

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const router = useRouter();

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await apiService.getEvent(params.id);
      console.log('Evento cargado:', eventData);
      
      setEvent(eventData as Event);
    } catch (error) {
      console.error('Error loading event:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error al cargar evento</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link 
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-800 mb-2">Evento no encontrado</h2>
          <p className="text-yellow-600 mb-4">El evento solicitado no existe o ha sido eliminado.</p>
          <Link 
            href="/admin/events"
            className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a eventos
          </Link>
        </div>
      </div>
    );
  }

  const occupancyPercentage = calculateOccupancy(event.capacity, event.available_spots || 0);
  const attendees = event.capacity - (event.available_spots || 0);

  const tabs = [
    {
      id: 'details' as TabType,
      name: 'Detalles del Evento',
      icon: List,
      count: null
    },
    {
      id: 'attendees' as TabType,
      name: 'Registros & Check-ins',
      icon: UserCheck,
      count: attendees
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/events"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detalle del Evento
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Información completa del evento
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button className="px-4 py-2 text-gray-600 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <QrCode className="w-4 h-4" />
            <span>QR Code</span>
          </button>
          
          <button className="px-4 py-2 text-gray-600 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Share className="w-4 h-4" />
            <span>Compartir</span>
          </button>
          
          <button className="px-4 py-2 text-gray-600 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <Link 
            href={`/admin/events/${event.id}/edit`}
            className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
                {tab.count !== null && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${isActive 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main event info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event header card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {event.image_url && (
                <div className="h-64 bg-gray-200 dark:bg-gray-700">
                  <img 
                    src={event.image_url} 
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h2>
                    <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                      {event.category}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>
            </motion.div>

            {/* Event details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Información del Evento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Fecha</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatEventDate(event.date)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Hora</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ubicación</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Capacidad</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {attendees}/{event.capacity} asistentes
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Activity className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Estado</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(event.date) > new Date() ? 'Próximo' : 'Completado'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Tag className="w-5 h-5 text-ccb-blue" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">ID</p>
                      <p className="font-medium text-gray-900 dark:text-white font-mono">
                        {event.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Occupancy stats */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Ocupación
              </h3>
              
              <div className="text-center mb-4">
                <div className={`text-3xl font-bold mb-1 ${getOccupancyColor(occupancyPercentage).includes('green') ? 'text-green-600' : 
                  getOccupancyColor(occupancyPercentage).includes('yellow') ? 'text-yellow-600' : 'text-red-600'}`}>
                  {occupancyPercentage.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {attendees} de {event.capacity} cupos ocupados
                </p>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue h-3 rounded-full transition-all duration-300"
                  style={{ width: `${occupancyPercentage}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {attendees}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confirmados
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {event.available_spots || 0}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Disponibles
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick actions */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h3>
              
              <div className="space-y-3">
                <Link 
                  href={`/admin/events/${event.id}/edit`}
                  className="w-full flex items-center justify-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Evento
                </Link>
                
                <button className="w-full flex items-center justify-center px-4 py-2 text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <QrCode className="w-4 h-4 mr-2" />
                  Ver Check-ins
                </button>
                
                <button className="w-full flex items-center justify-center px-4 py-2 text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Lista
                </button>
              </div>
            </motion.div>

            {/* Event metadata */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Metadatos
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Creado:</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(event.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">ID:</span>
                  <span className="text-gray-900 dark:text-white font-mono text-xs">
                    {event.id}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {activeTab === 'attendees' && (
        <EventAttendees 
          eventId={params.id}
          eventTitle={event.title}
        />
      )}
    </div>
  );
}
