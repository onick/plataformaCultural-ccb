"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Grid3X3,
  List,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/api';
import QuickEventModal from '@/components/modals/QuickEventModal';
import FullEventForm from '@/components/forms/FullEventForm';

interface EventData {
  id: string;
  title: string;
  date: number;
  time: string;
  category: string;
  type: 'cinema' | 'concert' | 'workshop' | 'exhibition' | 'conference' | 'experience';
  status: 'confirmed' | 'pending' | 'critical';
  color: string;
  location: string;
  attendees: number;
  capacity: number;
}

const EventCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 6)); // Julio 2025
  const [selectedView, setSelectedView] = useState('Month');
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date()); // For day view
  const [showFullForm, setShowFullForm] = useState(false);
  const [formInitialData, setFormInitialData] = useState<any>(null);
  const router = useRouter();

  // Cargar eventos desde la API
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      console.log('🎯 EventCalendar: Loading events...');
      
      const apiEvents = await apiService.getEvents();
      console.log('✅ EventCalendar: Received events:', apiEvents);
      
      // Convertir eventos de la API al formato del calendario
      const calendarEvents: EventData[] = apiEvents.map(event => {
        const eventDate = new Date(event.date);
        const dayOfMonth = eventDate.getDate();
        
        // Mapear categorías a tipos y colores
        const getCategoryMapping = (category: string) => {
          switch (category.toLowerCase()) {
            case 'cinema dominicano':
            case 'cine clásico':
            case 'cine general':
              return { type: 'cinema' as const, color: 'bg-red-100 border-red-300 text-red-800' };
            case 'conciertos':
              return { type: 'concert' as const, color: 'bg-blue-100 border-blue-300 text-blue-800' };
            case 'talleres':
              return { type: 'workshop' as const, color: 'bg-purple-100 border-purple-300 text-purple-800' };
            case 'exposiciones de arte':
              return { type: 'exhibition' as const, color: 'bg-green-100 border-green-300 text-green-800' };
            case 'charlas/conferencias':
              return { type: 'conference' as const, color: 'bg-orange-100 border-orange-300 text-orange-800' };
            case 'experiencias 3d inmersivas':
              return { type: 'experience' as const, color: 'bg-indigo-100 border-indigo-300 text-indigo-800' };
            default:
              return { type: 'conference' as const, color: 'bg-gray-100 border-gray-300 text-gray-800' };
          }
        };
        
        const mapping = getCategoryMapping(event.category);
        const attendees = event.available_spots ? event.capacity - event.available_spots : 0;
        
        return {
          id: event.id,
          title: event.title,
          date: dayOfMonth,
          time: event.time,
          category: event.category,
          type: mapping.type,
          status: attendees > event.capacity * 0.9 ? 'critical' : 
                 attendees > event.capacity * 0.5 ? 'confirmed' : 'pending',
          color: mapping.color,
          location: event.location,
          attendees,
          capacity: event.capacity
        };
      });
      
      console.log('✅ EventCalendar: Processed calendar events:', calendarEvents);
      setEvents(calendarEvents);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error loading events';
      console.error('🚨 EventCalendar: Error loading events:', error);
      
      // Log error to our error logger
      if (window.logError) {
        window.logError(errorMsg, 'EventCalendar - loadEvents()', {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString(),
          location: 'EventCalendar.loadEvents'
        });
      }
      
      setEvents([]);
    } finally {
      if (showLoadingState) {
        setLoading(false);
      }
    }
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    if (selectedView === 'Day') {
      setSelectedDate(new Date());
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDate = firstDay.getDay();

    const days = [];

    // Días del mes anterior
    for (let i = startDate - 1; i >= 0; i--) {
      const prevMonth = new Date(year, month - 1, 0);
      days.push({
        date: prevMonth.getDate() - i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    // Días del mes actual
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = today.getFullYear() === year && 
                     today.getMonth() === month && 
                     today.getDate() === day;
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday
      });
    }

    // Días del mes siguiente para completar la grilla
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  };

  const getEventsForDate = (date: number) => {
    return events.filter(event => event.date === date);
  };

  const handleDateClick = (date: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
    setSelectedDateForModal(clickedDate);
    setQuickModalOpen(true);
  };

  const handleEventCreated = async (newEvent: any) => {
    console.log('🎯 New event created:', newEvent);
    // Refresh events to show the new one
    await loadEvents(false);
  };

  const handleGoToFullForm = (eventData: any) => {
    // Instead of navigating, show the full form in the same place
    setFormInitialData(eventData);
    setShowFullForm(true);
    setQuickModalOpen(false);
  };

  const handleShowFullForm = () => {
    // Show full form from calendar header button
    setFormInitialData(null);
    setShowFullForm(true);
  };

  const handleFullFormCancel = () => {
    // Return to calendar view
    setShowFullForm(false);
    setFormInitialData(null);
  };

  const handleFullFormEventCreated = async (newEvent: any) => {
    // Event created successfully, return to calendar and refresh
    setShowFullForm(false);
    setFormInitialData(null);
    await loadEvents(false);
  };

  const handleEventClick = (event: EventData) => {
    // Navigate to event edit page
    router.push(`/admin/events/edit/${event.id}`);
  };

  const getEventsForSpecificDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    return events.filter(event => {
      const eventDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), event.date);
      return eventDate.getDate() === day && 
             eventDate.getMonth() === month && 
             eventDate.getFullYear() === year;
    });
  };

  const getEventsForWeek = (startDate: Date) => {
    const weekEvents = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      weekEvents.push({
        date: date,
        events: getEventsForSpecificDate(date)
      });
    }
    return weekEvents;
  };

  const getWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return { start: startOfWeek, end: endOfWeek };
  };

  const getMonthsInYear = (year: number) => {
    const months = [];
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(year, month, 1);
      const monthEvents = events.filter(event => {
        const eventDate = new Date(year, month, event.date);
        return eventDate.getMonth() === month && eventDate.getFullYear() === year;
      });
      months.push({
        date: monthDate,
        events: monthEvents
      });
    }
    return months;
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('es-DO', { 
      month: 'short', 
      day: 'numeric' 
    });
    const endStr = end.toLocaleDateString('es-DO', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
    return `${startStr} - ${endStr}`;
  };

  const navigateView = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (selectedView) {
      case 'Day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'Week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'Month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'Year':
        newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getViewTitle = () => {
    switch (selectedView) {
      case 'Day':
        return currentDate.toLocaleDateString('es-DO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case 'Week':
        const weekRange = getWeekRange(currentDate);
        return formatDateRange(weekRange.start, weekRange.end);
      case 'Month':
        return `${monthNames[currentDate.getMonth()]} - ${currentDate.getFullYear()}`;
      case 'Year':
        return `${currentDate.getFullYear()}`;
      default:
        return `${monthNames[currentDate.getMonth()]} - ${currentDate.getFullYear()}`;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      case 'pending':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
    }
  };

  const upcomingEvents = events
    .filter(event => event.date >= new Date().getDate())
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  // Mostrar loader mientras se cargan los eventos
  if (loading) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ccb-blue mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Cargando eventos del calendario...</p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-80">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show full form if requested
  if (showFullForm) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="flex-1">
          <FullEventForm
            onCancel={handleFullFormCancel}
            onEventCreated={handleFullFormEventCreated}
            selectedDate={selectedDateForModal}
            initialData={formInitialData}
          />
        </div>
        {/* Panel Lateral de Eventos - mantener visible */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Filtros rápidos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {['Todos', 'Cinema', 'Conciertos', 'Talleres'].map((filter) => (
                  <button
                    key={filter}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      filter === 'Todos'
                        ? 'bg-ccb-blue text-white border-ccb-blue'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Próximos Eventos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Próximos Eventos
            </h3>
            
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <motion.div
                  key={event.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  {getStatusIcon(event.status)}
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                      {event.title}
                    </h4>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {event.date} de {monthNames[currentDate.getMonth()]}
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {event.time}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {event.attendees}/{event.capacity}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 text-xs rounded-full ${
                    event.status === 'critical' ? 'bg-red-100 text-red-800' :
                    event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {event.status === 'critical' ? 'Crítico' :
                     event.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Panel Principal del Calendario */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Header del Calendario */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Botón Crear Evento */}
            <button
              onClick={handleShowFullForm}
              className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear evento</span>
            </button>
          </div>

          {/* Controles de Navegación */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Hoy
            </button>

            <div className="flex items-center space-x-4">
              <button onClick={() => navigateView('prev')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px] text-center capitalize">
                {getViewTitle()}
              </h2>
              
              <button onClick={() => navigateView('next')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Selector de Vista */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {['Day', 'Week', 'Month', 'Year'].map((view) => (
                <button
                  key={view}
                  onClick={() => setSelectedView(view)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    selectedView === view
                      ? 'bg-ccb-blue text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {view === 'Day' ? 'Día' : view === 'Week' ? 'Semana' : view === 'Month' ? 'Mes' : 'Año'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenido del Calendario */}
        <div className="p-6">
          {selectedView === 'Month' && (
            <>
              {/* Encabezados de días */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {weekDays.map((day, index) => (
                  <div key={day} className="text-center py-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {dayNames[index]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth().map((day, index) => {
                  const dayEvents = day.isCurrentMonth ? getEventsForDate(day.date) : [];
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      className={`min-h-[120px] p-2 rounded-lg border-2 transition-colors cursor-pointer ${
                        day.isCurrentMonth
                          ? day.isToday
                            ? 'bg-ccb-blue/10 border-ccb-blue'
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                          : 'bg-gray-25 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-50'
                      }`}
                      onClick={() => handleDateClick(day.date, day.isCurrentMonth)}
                    >
                      <div className={`text-sm font-medium mb-2 ${
                        day.isCurrentMonth 
                          ? day.isToday 
                            ? 'text-ccb-blue' 
                            : 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {day.date}
                      </div>

                      {/* Eventos del día */}
                      <div className="space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <motion.div
                            key={event.id}
                            whileHover={{ scale: 1.05 }}
                            className={`text-xs p-1 rounded border cursor-pointer ${event.color}`}
                            title={`${event.title} - ${event.time} - ${event.location}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="flex items-center justify-between">
                              <span className="opacity-75">{event.time}</span>
                              {getStatusIcon(event.status)}
                            </div>
                          </motion.div>
                        ))}
                        
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                            +{dayEvents.length - 2} más
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </>
          )}

          {selectedView === 'Day' && (
            <div className="space-y-4">
              {/* Vista de día */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                  {currentDate.toLocaleDateString('es-DO', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </h3>
                
                <div className="space-y-3">
                  {getEventsForSpecificDate(currentDate).length > 0 ? (
                    getEventsForSpecificDate(currentDate).map((event) => (
                      <motion.div
                        key={event.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-4 rounded-lg border-l-4 cursor-pointer ${event.color.replace('border-', 'border-l-')} bg-white dark:bg-gray-800`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{event.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{event.category}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {event.time}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {event.location}
                              </div>
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {event.attendees}/{event.capacity}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(event.status)}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No hay eventos programados para este día</p>
                      <button
                        onClick={() => {
                          setSelectedDateForModal(currentDate);
                          setQuickModalOpen(true);
                        }}
                        className="mt-4 px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Crear Evento
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {selectedView === 'Week' && (
            <div className="space-y-4">
              {/* Vista de semana */}
              <div className="grid grid-cols-7 gap-2">
                {/* Encabezados */}
                {dayNames.map((day, index) => (
                  <div key={day} className="text-center py-3 font-medium text-gray-700 dark:text-gray-300">
                    {day}
                  </div>
                ))}
                
                {/* Días de la semana */}
                {getEventsForWeek(getWeekRange(currentDate).start).map((dayData, index) => (
                  <div key={index} className="space-y-2">
                    <div className="text-center py-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      {dayData.date.getDate()}
                    </div>
                    <div className="space-y-1 min-h-[200px]">
                      {dayData.events.map((event) => (
                        <motion.div
                          key={event.id}
                          whileHover={{ scale: 1.02 }}
                          className={`text-xs p-2 rounded border cursor-pointer ${event.color}`}
                          title={`${event.title} - ${event.time}`}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-75">{event.time}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedView === 'Year' && (
            <div className="space-y-4">
              {/* Vista de año */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {getMonthsInYear(currentDate.getFullYear()).map((monthData, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => {
                      setCurrentDate(new Date(currentDate.getFullYear(), index));
                      setSelectedView('Month');
                    }}
                  >
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {monthNames[index]}
                    </h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {monthData.events.length} evento{monthData.events.length !== 1 ? 's' : ''}
                    </div>
                    {monthData.events.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {monthData.events.slice(0, 3).map((event) => (
                          <div key={event.id} className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {event.title}
                          </div>
                        ))}
                        {monthData.events.length > 3 && (
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            +{monthData.events.length - 3} más
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Lateral de Eventos */}
      <div className="w-full lg:w-80 space-y-4">
        {/* Filtros rápidos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Filtros</h3>
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {['Todos', 'Cinema', 'Conciertos', 'Talleres'].map((filter) => (
                <button
                  key={filter}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filter === 'Todos'
                      ? 'bg-ccb-blue text-white border-ccb-blue'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Próximos Eventos */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Próximos Eventos
          </h3>
          
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <motion.div
                key={event.id}
                whileHover={{ scale: 1.02 }}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              >
                {getStatusIcon(event.status)}
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {event.title}
                  </h4>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {event.date} de {monthNames[currentDate.getMonth()]}
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {event.time}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {event.attendees}/{event.capacity}
                    </div>
                  </div>
                </div>
                
                <div className={`px-2 py-1 text-xs rounded-full ${
                  event.status === 'critical' ? 'bg-red-100 text-red-800' :
                  event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {event.status === 'critical' ? 'Crítico' :
                   event.status === 'pending' ? 'Pendiente' : 'Confirmado'}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Event Modal */}
      <QuickEventModal
        isOpen={quickModalOpen}
        onClose={() => setQuickModalOpen(false)}
        selectedDate={selectedDateForModal}
        onEventCreated={handleEventCreated}
        onGoToFullForm={handleGoToFullForm}
      />
    </div>
  );
};

export default EventCalendar;