'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import CheckInSystem from '@/components/CheckInSystem';
import { apiService } from '@/services/api';

interface CheckInStats {
  totalReservations: number;
  checkedIn: number;
  pending: number;
  checkInRate: number;
}

interface RecentCheckIn {
  id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  code: string;
  time: string;
}

export default function CheckInPage() {
  const [stats, setStats] = useState<CheckInStats>({
    totalReservations: 0,
    checkedIn: 0,
    pending: 0,
    checkInRate: 0
  });
  const [recentCheckIns, setRecentCheckIns] = useState<RecentCheckIn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckInData();
  }, []);

  const loadCheckInData = async () => {
    try {
      setLoading(true);
      
      // Obtener estadísticas de check-in y reservas
      const [checkInResponse, reservationResponse] = await Promise.all([
        apiService.getCheckInStats(),
        apiService.getReservationStats()
      ]);

      const totalReservations = reservationResponse.data?.total_reservations || 0;
      const checkedIn = reservationResponse.data?.checked_in_reservations || 0;
      const pending = reservationResponse.data?.confirmed_reservations || 0;
      const checkInRate = totalReservations > 0 ? (checkedIn / totalReservations) * 100 : 0;

      setStats({
        totalReservations,
        checkedIn,
        pending,
        checkInRate: Math.round(checkInRate * 10) / 10
      });

      // Obtener check-ins recientes
      const recentCheckInsData = checkInResponse.recent_checkins || [];
      const formattedCheckIns: RecentCheckIn[] = recentCheckInsData.map((checkIn: any, index: number) => ({
        id: `${checkIn.timestamp}-${index}`,
        userName: checkIn.user_name,
        userEmail: checkIn.user_email || 'No disponible',
        eventTitle: checkIn.event_title,
        code: checkIn.checkin_code || 'N/A',
        time: checkIn.timestamp
      }));

      setRecentCheckIns(formattedCheckIns);
    } catch (error) {
      console.error('Error loading check-in data:', error);
      
      // Fallback a datos por defecto en caso de error
      setStats({
        totalReservations: 0,
        checkedIn: 0,
        pending: 0,
        checkInRate: 0
      });
      setRecentCheckIns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInSuccess = (newCheckIn: any) => {
    setRecentCheckIns(prev => [newCheckIn, ...prev.slice(0, 9)]);
    loadCheckInData();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} horas`;
    return date.toLocaleDateString('es-DO');
  };

  const getCheckInRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-ccb-blue mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de check-in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-in Digital</h1>
          <p className="mt-2 text-gray-600">
            Sistema de verificación de entrada para eventos
          </p>
        </div>
        <button
          onClick={loadCheckInData}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reservas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalReservations}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Check-ins</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.checkedIn}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa Check-in</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.checkInRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Check-in System and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Check-in System */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sistema de Check-in</h2>
          <CheckInSystem onCheckInSuccess={handleCheckInSuccess} />
        </motion.div>

        {/* Recent Check-ins */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Check-ins Recientes</h2>
          <div className="space-y-4">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.map((checkIn) => (
                <div key={checkIn.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{checkIn.userName}</p>
                    <p className="text-sm text-gray-500">{checkIn.eventTitle}</p>
                    <p className="text-xs text-gray-400">Código: {checkIn.code}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500">{formatTime(checkIn.time)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay check-ins recientes</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Performance Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Rendimiento del Check-in</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getCheckInRateColor(stats.checkInRate)}`}>
            {stats.checkInRate >= 80 ? 'Excelente' : stats.checkInRate >= 60 ? 'Bueno' : 'Mejorar'}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue h-2 rounded-full transition-all duration-500"
            style={{ width: `${stats.checkInRate}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {stats.checkedIn} de {stats.totalReservations} personas han completado el check-in
        </p>
      </motion.div>
    </div>
  );
}