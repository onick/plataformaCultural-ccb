'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  QrCode,
  Download,
  Share2,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  X,
  Ticket,
  Loader2,
  ExternalLink,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/api';
import { formatDate, getCategoryIcon } from '@/utils/libUtils';
import { categoryToSpanish } from '@/utils/eventUtils';
import Link from 'next/link';

interface ReservationDetail {
  id: string;
  event_id: string;
  event_title: string;
  event_description: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_category: string;
  event_capacity: number;
  event_image_url?: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  status: 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';
  checkin_code: string;
  qr_code?: string;
  created_at: string;
  checked_in_at?: string;
  cancelled_at?: string;
  notes?: string;
}

const STATUS_INFO = {
  confirmed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    label: 'Confirmada',
    icon: CheckCircle,
    description: 'Tu reserva está confirmada. Puedes hacer check-in el día del evento.'
  },
  checked_in: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Asististe',
    icon: CheckCircle,
    description: 'Has completado el check-in para este evento.'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Cancelada',
    icon: X,
    description: 'Esta reserva ha sido cancelada.'
  },
  no_show: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    label: 'No asististe',
    icon: AlertCircle,
    description: 'No se registró tu asistencia a este evento.'
  }
};

interface PageProps {
  params: {
    id: string;
  };
}

export default function ReservationDetailPage({ params }: PageProps) {
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadReservation();
  }, [params.id]);

  const loadReservation = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
        return;
      }

      const reservationData = await apiService.getReservation(params.id);
      
      // Normalize category to Spanish
      const normalizedReservation = {
        ...reservationData,
        event_category: categoryToSpanish(reservationData.event_category || reservationData.category || 'General')
      };
      
      setReservation(normalizedReservation);
    } catch (error: any) {
      console.error('Error loading reservation:', error);
      if (error.response?.status === 401) {
        router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      } else if (error.response?.status === 404) {
        setError('Reserva no encontrada');
      } else {
        setError('Error al cargar la reserva');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservation.id);
      await loadReservation(); // Reload to get updated status
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error al cancelar la reserva. Por favor intenta nuevamente.');
    }
  };

  const generateQRCode = (reservation: ReservationDetail) => {
    const qrData = `reservation:${reservation.id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
  };

  const handleShare = async () => {
    if (!reservation) return;
    
    const shareData = {
      title: `Reserva para ${reservation.event_title}`,
      text: `Tengo una reserva para ${reservation.event_title} el ${formatDate(reservation.event_date)}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const handleCopyCode = () => {
    if (!reservation) return;
    navigator.clipboard.writeText(reservation.checkin_code);
    alert('Código copiado al portapapeles');
  };

  const handleDownloadQR = () => {
    if (!reservation) return;
    
    const qrUrl = generateQRCode(reservation);
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qr-${reservation.checkin_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-ccb-blue mx-auto mb-4" />
              <p className="text-gray-600">Cargando detalles de la reserva...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Reserva no encontrada</h2>
              <p className="text-gray-600 mb-4">{error || 'La reserva que buscas no existe.'}</p>
              <div className="space-x-4">
                <Button onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/reservations">Ver todas las reservas</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_INFO[reservation.status];
  const canCancel = reservation.status === 'confirmed' && new Date(reservation.event_date) > new Date();
  const isPastEvent = new Date(reservation.event_date) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Reservas
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Event Image */}
          <div className="relative h-64 md:h-80 rounded-lg overflow-hidden">
            {reservation.event_image_url ? (
              <img
                src={reservation.event_image_url}
                alt={reservation.event_title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-ccb-blue to-ccb-lightblue flex items-center justify-center">
                <span className="text-8xl text-white">{getCategoryIcon(reservation.event_category)}</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              <Badge className={statusInfo.color}>
                <statusInfo.icon className="w-4 h-4 mr-2" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>

          {/* Reservation Header */}
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {reservation.event_title}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {statusInfo.description}
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <span>Código: {reservation.checkin_code}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyCode}
                className="h-auto p-1"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-ccb-blue" />
                    Información del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Fecha</p>
                        <p className="text-gray-600">{formatDate(reservation.event_date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Hora</p>
                        <p className="text-gray-600">{reservation.event_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Ubicación</p>
                        <p className="text-gray-600">{reservation.event_location}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Capacidad</p>
                        <p className="text-gray-600">{reservation.event_capacity} personas</p>
                      </div>
                    </div>
                  </div>
                  
                  {reservation.event_description && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Descripción</h4>
                      <p className="text-gray-600">{reservation.event_description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Reservation Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Cronología de la Reserva</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Reserva creada</p>
                        <p className="text-sm text-gray-600">{formatDate(reservation.created_at)}</p>
                      </div>
                    </div>
                    
                    {reservation.checked_in_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Check-in completado</p>
                          <p className="text-sm text-gray-600">{formatDate(reservation.checked_in_at)}</p>
                        </div>
                      </div>
                    )}
                    
                    {reservation.cancelled_at && (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <X className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium">Reserva cancelada</p>
                          <p className="text-sm text-gray-600">{formatDate(reservation.cancelled_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* QR Code */}
              {reservation.status === 'confirmed' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <QrCode className="w-5 h-5 mr-2 text-ccb-blue" />
                      Código QR
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="p-4 bg-white rounded-lg shadow-sm border mb-4">
                      <img 
                        src={generateQRCode(reservation)} 
                        alt="QR Code" 
                        className="w-full max-w-48 mx-auto"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Muestra este código QR al llegar al evento para hacer check-in
                    </p>
                    <Button 
                      onClick={handleDownloadQR}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar QR
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{reservation.user_email}</span>
                  </div>
                  {reservation.user_phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{reservation.user_phone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <Link href={`/events/${reservation.event_id}`}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Ver Evento
                    </Link>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Resend confirmation email
                      alert('Confirmación enviada a tu email.');
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Reenviar Email
                  </Button>
                  
                  {canCancel && (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={handleCancelReservation}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}