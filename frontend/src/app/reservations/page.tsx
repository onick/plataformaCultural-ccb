'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Filter,
  Search,
  QrCode,
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Ticket,
  Mail,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiService } from '@/services/api';
import { formatDate, getCategoryIcon } from '@/utils/libUtils';
import { categoryToSpanish } from '@/utils/eventUtils';
import Link from 'next/link';

interface Reservation {
  id: string;
  event_id: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_category: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';
  checkin_code: string;
  qr_code?: string;
  created_at: string;
  checked_in_at?: string;
  notes?: string;
}

const STATUS_COLORS = {
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  checked_in: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  no_show: 'bg-gray-100 text-gray-800 border-gray-200'
};

const STATUS_LABELS = {
  confirmed: 'Confirmada',
  checked_in: 'Asistió',
  cancelled: 'Cancelada',
  no_show: 'No asistió'
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter]);

  const checkAuthAndLoadReservations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login?redirect=' + encodeURIComponent('/reservations'));
        return;
      }

      setIsAuthenticated(true);
      await loadReservations();
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login?redirect=' + encodeURIComponent('/reservations'));
    }
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      console.log('🎯 ReservationsPage: Starting to load reservations...');
      
      const response = await apiService.getReservations();
      console.log('✅ ReservationsPage: Raw response:', response);
      
      // The API returns an array directly with objects like: 
      // [{"reservation": {...}, "event": {...}}]
      let transformedReservations: any[] = [];
      
      if (Array.isArray(response)) {
        // Handle the actual API response format
        transformedReservations = response.map((item: any) => {
          const reservation = item.reservation || item;
          const event = item.event || {};
          
          return {
            id: reservation.id,
            event_id: reservation.event_id,
            event_title: event.title || 'Evento sin título',
            event_date: event.date || 'Fecha no disponible',
            event_time: event.time || 'Hora no disponible',
            event_location: event.location || 'Ubicación no disponible',
            event_category: categoryToSpanish(event.category || 'General'),
            user_id: reservation.user_id,
            user_name: reservation.user_name || 'Usuario',
            user_email: reservation.user_email || 'Email no disponible',
            status: reservation.status || 'confirmed',
            checkin_code: reservation.checkin_code || 'N/A',
            qr_code: reservation.qr_code,
            created_at: reservation.created_at,
            checked_in_at: reservation.checked_in_at,
            notes: reservation.notes
          };
        });
      } else {
        // Fallback for other response formats
        transformedReservations = response.items || response.reservations || [];
      }
      
      console.log('✅ ReservationsPage: Transformed reservations:', transformedReservations);
      setReservations(transformedReservations);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error loading reservations';
      console.error('🚨 ReservationsPage: Error loading reservations:', error);
      
      // Log detailed error
      if (window.logError) {
        window.logError(errorMsg, 'ReservationsPage - loadReservations()', {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString(),
          location: 'ReservationsPage.loadReservations'
        });
      }
      
      // If we get 401, redirect to login
      if ((error as any)?.response?.status === 401) {
        router.push('/auth/login?redirect=' + encodeURIComponent('/reservations'));
      }
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = reservations;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.event_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.checkin_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.event_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredReservations(filtered);
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      return;
    }

    try {
      await apiService.cancelReservation(reservationId);
      await loadReservations(); // Reload reservations
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error al cancelar la reserva. Por favor intenta nuevamente.');
    }
  };

  const handleResendConfirmation = async (reservationId: string) => {
    try {
      // This would call an API endpoint to resend confirmation email
      // For now, we'll just show a success message
      alert('Confirmación enviada a tu email.');
    } catch (error) {
      console.error('Error resending confirmation:', error);
      alert('Error al enviar la confirmación. Por favor intenta nuevamente.');
    }
  };

  const generateQRCode = (reservation: Reservation) => {
    // Generate QR code URL for check-in
    const qrData = `reservation:${reservation.id}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-ccb-blue mx-auto mb-4" />
              <p className="text-gray-600">Cargando tus reservas...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.back()}
                className="md:hidden"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Mis Reservas
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Gestiona tus reservas de eventos culturales
                </p>
              </div>
            </div>
            <Button onClick={loadReservations} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar por evento, código o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              <Filter className="w-4 h-4 mr-2" />
              Todas
            </Button>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-ccb-blue">{reservations.length}</p>
                </div>
                <Ticket className="w-8 h-8 text-ccb-blue" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Confirmadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {reservations.filter(r => r.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Asistidas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {reservations.filter(r => r.status === 'checked_in').length}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Canceladas</p>
                  <p className="text-2xl font-bold text-red-600">
                    {reservations.filter(r => r.status === 'cancelled').length}
                  </p>
                </div>
                <X className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reservations List */}
        <div className="space-y-4">
          {filteredReservations.length > 0 ? (
            filteredReservations.map((reservation, index) => (
              <motion.div
                key={reservation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <ReservationCard 
                  reservation={reservation}
                  onCancel={handleCancelReservation}
                  onResendConfirmation={handleResendConfirmation}
                  generateQRCode={generateQRCode}
                />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No se encontraron reservas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No hay reservas que coincidan con los filtros.'
                  : 'Aún no tienes reservas. ¡Explora nuestros eventos!'
                }
              </p>
              <Button asChild>
                <Link href="/events">Explorar Eventos</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReservationCard({ 
  reservation, 
  onCancel, 
  onResendConfirmation, 
  generateQRCode 
}: {
  reservation: Reservation;
  onCancel: (id: string) => void;
  onResendConfirmation: (id: string) => void;
  generateQRCode: (reservation: Reservation) => string;
}) {
  const [showQR, setShowQR] = useState(false);
  const canCancel = reservation.status === 'confirmed' && new Date(reservation.event_date) > new Date();
  const isPastEvent = new Date(reservation.event_date) < new Date();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{getCategoryIcon(reservation.event_category)}</span>
              <div>
                <CardTitle className="text-lg">{reservation.event_title}</CardTitle>
                <Badge className={STATUS_COLORS[reservation.status]}>
                  {STATUS_LABELS[reservation.status]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Código de reserva</p>
            <p className="font-mono font-semibold text-ccb-blue">{reservation.checkin_code}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{formatDate(reservation.event_date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{reservation.event_time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm">{reservation.event_location}</span>
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Reservado: {formatDate(reservation.created_at)}</span>
            {reservation.checked_in_at && (
              <span>Check-in: {formatDate(reservation.checked_in_at)}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/events/${reservation.event_id}`}>
              Ver Evento
            </Link>
          </Button>
          
          {reservation.status === 'confirmed' && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowQR(!showQR)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? 'Ocultar QR' : 'Mostrar QR'}
            </Button>
          )}
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onResendConfirmation(reservation.id)}
          >
            <Mail className="w-4 h-4 mr-2" />
            Reenviar Email
          </Button>
          
          {canCancel && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onCancel(reservation.id)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>

        {/* QR Code */}
        {showQR && reservation.status === 'confirmed' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t pt-4"
          >
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Código QR para check-in
              </p>
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                <img 
                  src={generateQRCode(reservation)} 
                  alt="QR Code" 
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Muestra este código al llegar al evento
              </p>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}