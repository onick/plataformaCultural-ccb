'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  QrCode,
  User,
  Mail,
  Calendar,
  Loader2
} from 'lucide-react';
import { apiService } from '@/services/api';

type CheckInMethod = 'qr' | 'code' | 'email' | 'name';
type CheckInStatus = 'idle' | 'searching' | 'found' | 'success' | 'error';

interface CheckInData {
  id: string;
  userName: string;
  userEmail: string;
  eventTitle: string;
  eventDate: string;
  code: string;
  status: 'pending' | 'checked_in';
}

interface CheckInSystemProps {
  onCheckInSuccess?: (data: CheckInData) => void;
}

const checkInMethods = [
  {
    id: 'qr' as CheckInMethod,
    name: 'Código QR',
    icon: QrCode,
    placeholder: 'Escanear código QR...',
    description: 'Escanea el código QR del ticket',
    apiMethod: 'qr_code'
  },
  {
    id: 'code' as CheckInMethod,
    name: 'Código',
    icon: Search,
    placeholder: 'Ingresa el código de reserva',
    description: 'Código de 8 caracteres',
    apiMethod: 'reservation_code'
  },
  {
    id: 'email' as CheckInMethod,
    name: 'Email',
    icon: Mail,
    placeholder: 'Buscar por email',
    description: 'Email del participante',
    apiMethod: 'email'
  },
  {
    id: 'name' as CheckInMethod,
    name: 'Nombre',
    icon: User,
    placeholder: 'Buscar por nombre',
    description: 'Nombre completo',
    apiMethod: 'name'
  }
];

export default function CheckInSystem({ onCheckInSuccess }: CheckInSystemProps) {
  const [method, setMethod] = useState<CheckInMethod>('qr');
  const [searchValue, setSearchValue] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>('idle');
  const [foundReservation, setFoundReservation] = useState<CheckInData | null>(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ todayCheckIns: 0, checkInRate: 0 });

  useEffect(() => {
    loadCheckInStats();
  }, []);

  const loadCheckInStats = async () => {
    try {
      const response = await apiService.getCheckInStats();
      setStats({
        todayCheckIns: response.checkins_today || 0,
        checkInRate: response.checkin_rate || 0
      });
    } catch (error) {
      console.error('Error loading check-in stats:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) return;

    setCheckInStatus('searching');
    setError('');

    try {
      const currentMethod = checkInMethods.find(m => m.id === method);
      if (!currentMethod) throw new Error('Método de check-in inválido');

      // For now, we'll show a mock reservation since server.py doesn't have a separate search endpoint
      // In production, this would be a separate endpoint to preview reservations
      const mockReservation = {
        id: 'preview-reservation',
        userName: 'Usuario - Búsqueda',
        userEmail: 'Verifica el código antes de continuar',
        eventTitle: 'Evento será mostrado tras verificación',
        eventDate: new Date().toISOString(),
        code: searchValue.trim(),
        status: 'pending' as const
      };

      setFoundReservation(mockReservation);
      setCheckInStatus('found');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error en la búsqueda');
      setCheckInStatus('error');
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!foundReservation) return;

    setCheckInStatus('searching');

    try {
      const currentMethod = checkInMethods.find(m => m.id === method);
      if (!currentMethod) throw new Error('Método de check-in inválido');

      const response = await apiService.checkInUser(
        currentMethod.apiMethod,
        searchValue.trim()
      );

      if (response.success) {
        const checkedInData = {
          id: response.reservation_id || foundReservation.id,
          userName: response.user_name || foundReservation.userName,
          userEmail: response.user_email || foundReservation.userEmail,
          eventTitle: response.event_title || foundReservation.eventTitle,
          eventDate: foundReservation.eventDate,
          code: foundReservation.code,
          status: 'checked_in' as const
        };

        setFoundReservation(checkedInData);
        setCheckInStatus('success');
        onCheckInSuccess?.(checkedInData);
        
        // Actualizar estadísticas
        loadCheckInStats();

        // Reset después de 3 segundos
        setTimeout(resetForm, 3000);
      } else {
        throw new Error(response.message || 'Error al confirmar check-in');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error al confirmar check-in');
      setCheckInStatus('error');
    }
  };

  const resetForm = () => {
    setSearchValue('');
    setFoundReservation(null);
    setCheckInStatus('idle');
    setError('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Method Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {checkInMethods.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => {
                setMethod(m.id);
                resetForm();
              }}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200 text-center
                ${method === m.id 
                  ? 'border-ccb-blue bg-ccb-blue/10 text-ccb-blue' 
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
            >
              <Icon size={20} className="mx-auto mb-2" />
              <p className="text-sm font-medium">{m.name}</p>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={checkInMethods.find(m => m.id === method)?.placeholder}
          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          disabled={checkInStatus === 'searching' || checkInStatus === 'success'}
        />
        <button
          onClick={handleSearch}
          disabled={!searchValue.trim() || checkInStatus === 'searching' || checkInStatus === 'success'}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-ccb-blue hover:bg-ccb-blue/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkInStatus === 'searching' ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Search size={20} />
          )}
        </button>
      </div>

      {/* Method Description */}
      <p className="text-sm text-gray-600 text-center">
        {checkInMethods.find(m => m.id === method)?.description}
      </p>

      {/* Results */}
      <AnimatePresence mode="wait">
        {/* Error State */}
        {checkInStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <AlertCircle className="text-red-500" size={20} />
              <div>
                <h4 className="text-red-800 font-medium">Error</h4>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Intentar nuevamente
            </button>
          </motion.div>
        )}

        {/* Found Reservation */}
        {checkInStatus === 'found' && foundReservation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Clock className="text-blue-500" size={24} />
                <div>
                  <h4 className="text-blue-800 font-semibold">Reserva Encontrada</h4>
                  <p className="text-blue-600 text-sm">Confirma los datos antes de proceder</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <QrCode size={16} className="text-gray-400" />
                <span className="text-gray-600 font-mono">{foundReservation.code}</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  Al confirmar el check-in, se verificará y procesará la reserva con los datos reales del sistema.
                </p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirmCheckIn}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Confirmar Check-in
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {checkInStatus === 'success' && foundReservation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-green-800 font-semibold text-lg mb-2">
              ¡Check-in Exitoso!
            </h4>
            <p className="text-green-600 mb-4">
              {foundReservation.userName} ha sido registrado correctamente
            </p>
            <p className="text-sm text-green-700">
              {foundReservation.eventTitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {checkInStatus === 'idle' && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-2xl font-bold text-ccb-blue">{stats.todayCheckIns}</p>
            <p className="text-sm text-gray-600">Check-ins Hoy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.checkInRate}%</p>
            <p className="text-sm text-gray-600">Tasa de Éxito</p>
          </div>
        </div>
      )}
    </div>
  );
}