'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ArrowLeft, 
  Ticket,
  Share2,
  Heart,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Event } from '@/types';
import { formatDate, getCategoryIcon } from '@/utils/libUtils';
import { categoryToSpanish } from '@/utils/eventUtils';
import Link from 'next/link';

interface PageProps {
  params: {
    id: string;
  };
}

export default function EventDetailPage({ params }: PageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadEvent();
  }, [params.id]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData = await apiService.getEvent(params.id);
      console.log('Event loaded:', eventData);
      
      // Normalize category to Spanish
      const normalizedEvent = {
        ...eventData,
        category: categoryToSpanish(eventData.category)
      };
      
      setEvent(normalizedEvent as Event);
    } catch (error) {
      console.error('Error loading event:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleReservation = async () => {
    if (!event) return;
    
    try {
      setReserving(true);
      
      // Check if user is logged in
      const token = localStorage.getItem('auth_token');
      if (!token) {
        // Redirect to login
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }
      
      // Create reservation
      await apiService.createReservation(event.id);
      setReservationSuccess(true);
      
      // Reload event to update available spots
      setTimeout(() => {
        loadEvent();
        setReservationSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Error al crear la reserva. Por favor intenta nuevamente.');
    } finally {
      setReserving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } else {
      // Fallback to copy URL
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-ccb-blue mx-auto mb-4" />
              <p className="text-gray-600">Cargando evento...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Evento no encontrado</h2>
              <p className="text-gray-600 mb-4">{error || 'El evento que buscas no existe.'}</p>
              <Button asChild>
                <Link href="/">Volver al inicio</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAvailable = (event.available_spots || 0) > 0;
  const spotsLeft = event.available_spots || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Event Image */}
          <div className="relative mb-8">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-64 md:h-96 bg-gradient-to-br from-ccb-blue to-ccb-lightblue rounded-lg flex items-center justify-center">
                <span className="text-8xl text-white">{getCategoryIcon(event.category)}</span>
              </div>
            )}
            
            {/* Category Badge */}
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/90 text-ccb-blue">
                <span className="mr-2">{getCategoryIcon(event.category)}</span>
                {event.category}
              </Badge>
            </div>

            {/* Availability Badge */}
            <div className="absolute top-4 right-4">
              <Badge 
                variant={isAvailable ? "success" : "destructive"}
                className="bg-white/90"
              >
                {isAvailable ? `${spotsLeft} cupos disponibles` : "Agotado"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {event.title}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {event.description}
              </p>

              {/* Event Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-ccb-blue" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Fecha</p>
                    <p className="text-gray-600 dark:text-gray-400">{formatDate(event.date)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-ccb-blue" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Hora</p>
                    <p className="text-gray-600 dark:text-gray-400">{event.time}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-ccb-blue" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Ubicación</p>
                    <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-ccb-blue" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Capacidad</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {(event.capacity - (event.available_spots || 0))}/{event.capacity} personas
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Ticket className="w-5 h-5 mr-2 text-ccb-blue" />
                    Reservar Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reservationSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center p-4 bg-green-50 rounded-lg border border-green-200"
                    >
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-800 mb-1">¡Reserva Exitosa!</h3>
                      <p className="text-sm text-green-600">
                        Tu reserva ha sido confirmada. Recibirás un email con los detalles.
                      </p>
                    </motion.div>
                  ) : (
                    <>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-ccb-blue mb-1">GRATIS</p>
                        <p className="text-sm text-gray-600">Entrada libre</p>
                      </div>

                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled={!isAvailable || reserving}
                        onClick={handleReservation}
                      >
                        {reserving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Procesando...
                          </>
                        ) : !isAvailable ? (
                          "No disponible"
                        ) : (
                          <>
                            <Ticket className="w-4 h-4 mr-2" />
                            Reservar Ahora
                          </>
                        )}
                      </Button>

                      {!isAvailable && (
                        <p className="text-sm text-red-600 text-center">
                          Este evento ya no tiene cupos disponibles.
                        </p>
                      )}
                    </>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartir
                      </Button>
                      <Button variant="outline" size="sm">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}