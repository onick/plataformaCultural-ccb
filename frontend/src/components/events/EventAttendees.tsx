'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  X,
  Mail, 
  User,
  Calendar,
  Search,
  Filter,
  Download,
  QrCode,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { apiService } from '@/services/api';

interface Attendee {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';
  checkin_code: string;
  created_at: string;
  checked_in_at?: string | null;
  notes?: string | null;
}

interface AttendeeStats {
  total: number;
  confirmed: number;
  checked_in: number;
  cancelled: number;
  no_show: number;
}

interface EventAttendeesProps {
  eventId: string;
  eventTitle: string;
}

const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock
  },
  checked_in: {
    label: 'Asistió',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: X
  },
  no_show: {
    label: 'No asistió',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle
  }
};

export default function EventAttendees({ eventId, eventTitle }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<AttendeeStats>({
    total: 0,
    confirmed: 0,
    checked_in: 0,
    cancelled: 0,
    no_show: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkInLoading, setCheckInLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  useEffect(() => {
    filterAttendees();
  }, [attendees, searchTerm, statusFilter]);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      const { attendees: data, stats: statsData } = await apiService.getEventAttendees(eventId);
      setAttendees(data);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading attendees:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAttendees = () => {
    let filtered = attendees;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(attendee => 
        attendee.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.checkin_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(attendee => attendee.status === statusFilter);
    }

    setFilteredAttendees(filtered);
  };

  const handleQuickCheckIn = async (attendee: Attendee) => {
    if (attendee.status === 'checked_in' || attendee.status === 'cancelled') return;

    setCheckInLoading(attendee.id);
    try {
      await apiService.checkInUserForEvent(eventId, 'reservation_code', attendee.checkin_code);
      
      // Update local state
      setAttendees(prev => prev.map(a => 
        a.id === attendee.id 
          ? { ...a, status: 'checked_in', checked_in_at: new Date().toISOString() }
          : a
      ));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        confirmed: prev.confirmed - 1,
        checked_in: prev.checked_in + 1
      }));
    } catch (error) {
      console.error('Error checking in user:', error);
      alert('Error al realizar check-in. Inténtalo nuevamente.');
    } finally {
      setCheckInLoading(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCheckInRate = () => {
    if (stats.total === 0) return 0;
    return Math.round((stats.checked_in / stats.total) * 100);
  };

  const exportAttendees = () => {
    const csvContent = [
      ['Nombre', 'Email', 'Estado', 'Código', 'Fecha Registro', 'Check-in'],
      ...filteredAttendees.map(attendee => [
        attendee.user_name,
        attendee.user_email,
        STATUS_CONFIG[attendee.status].label,
        attendee.checkin_code,
        formatDateTime(attendee.created_at),
        attendee.checked_in_at ? formatDateTime(attendee.checked_in_at) : 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `asistentes_${eventTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando asistentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-blue-700">Total</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.confirmed}</div>
          <div className="text-sm text-yellow-700">Confirmados</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{stats.checked_in}</div>
          <div className="text-sm text-green-700">Asistieron</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-sm text-red-700">Cancelados</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{getCheckInRate()}%</div>
          <div className="text-sm text-purple-700">Check-in</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Todos los estados</option>
          <option value="confirmed">Confirmados</option>
          <option value="checked_in">Asistieron</option>
          <option value="cancelled">Cancelados</option>
          <option value="no_show">No asistieron</option>
        </select>

        <button
          onClick={exportAttendees}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Exportar</span>
        </button>

        <button
          onClick={loadAttendees}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Attendees List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {filteredAttendees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron asistentes
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Aún no hay personas registradas para este evento'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttendees.map((attendee) => {
                  const StatusIcon = STATUS_CONFIG[attendee.status].icon;
                  const isCheckingIn = checkInLoading === attendee.id;
                  
                  return (
                    <motion.tr
                      key={attendee.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {attendee.user_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {attendee.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_CONFIG[attendee.status].color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[attendee.status].label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono text-gray-900">
                          {attendee.checkin_code}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(attendee.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {attendee.checked_in_at ? formatDateTime(attendee.checked_in_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {attendee.status === 'confirmed' && (
                            <button
                              onClick={() => handleQuickCheckIn(attendee)}
                              disabled={isCheckingIn}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {isCheckingIn ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                              <span>Check-in</span>
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <QrCode className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {filteredAttendees.length} de {stats.total} asistentes
          </div>
          <div className="text-sm text-gray-600">
            Tasa de check-in: <span className="font-semibold text-blue-600">{getCheckInRate()}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}