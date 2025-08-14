'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit, 
  Trash2, 
  Activity,
  Ticket,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUsersStore } from '@/stores/users';
import { User as UserType } from '@/services/users';

interface UserDetailsProps {
  userId: string;
}

export default function UserDetails({ userId }: UserDetailsProps) {
  const router = useRouter();
  const { currentUser, loading, error, fetchUser, deleteUser } = useUsersStore();
  const [userStats, setUserStats] = useState({
    totalReservations: 0,
    totalCheckins: 0,
    attendanceRate: 0,
    recentActivity: []
  });

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  // Mock user stats - in real app, fetch from API
  useEffect(() => {
    if (currentUser) {
      setUserStats({
        totalReservations: currentUser.total_reservations || 0,
        totalCheckins: currentUser.total_checkins || 0,
        attendanceRate: currentUser.total_reservations && currentUser.total_checkins 
          ? Math.round((currentUser.total_checkins / currentUser.total_reservations) * 100)
          : 0,
        recentActivity: [] // This would come from API
      });
    }
  }, [currentUser]);

  const handleDelete = async () => {
    if (!currentUser) return;
    
    if (confirm(`¿Estás seguro de que quieres eliminar el usuario "${currentUser.name}"?`)) {
      try {
        await deleteUser(currentUser.id);
        router.push('/admin/users');
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Usuario no encontrado
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error || 'El usuario solicitado no existe o no tienes permisos para verlo.'}
        </p>
        <Link
          href="/admin/users"
          className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Usuarios
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/users"
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detalles del Usuario
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Información completa y estadísticas de {currentUser.name}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Link
            href={`/admin/users/${currentUser.id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </Link>
          
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-ccb-blue to-ccb-lightblue rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {currentUser.name}
                    </h2>
                    {currentUser.is_admin && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-4 h-4 mr-1" />
                        Administrador
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Miembro desde {formatDateShort(currentUser.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</p>
                    <p className="text-gray-900 dark:text-white">{currentUser.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</p>
                    <p className="text-gray-900 dark:text-white">{currentUser.phone}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</p>
                    <p className="text-gray-900 dark:text-white">{currentUser.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Edad</p>
                    <p className="text-gray-900 dark:text-white">{currentUser.age} años</p>
                  </div>
                </div>
              </div>
            </div>

            {currentUser.last_login && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Último acceso</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(currentUser.last_login)}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Activity & History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Actividad Reciente
            </h3>
            
            {userStats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {/* Activity items would go here */}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  No hay actividad reciente registrada
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estadísticas
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Ticket className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Reservas</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Total realizadas</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {userStats.totalReservations}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Check-ins</p>
                    <p className="text-xs text-green-600 dark:text-green-400">Eventos asistidos</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {userStats.totalCheckins}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">Asistencia</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">Tasa de participación</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {userStats.attendanceRate}%
                </span>
              </div>
            </div>
          </motion.div>

          {/* User Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Estado de la Cuenta
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estado</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  currentUser.is_admin 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {currentUser.is_admin ? 'Administrador' : 'Usuario Regular'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Registro</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDateShort(currentUser.created_at)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h3>
            
            <div className="space-y-2">
              <Link
                href={`/admin/users/${currentUser.id}/edit`}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Editar Usuario
                </span>
              </Link>
              
              <button
                onClick={() => {/* Reset password functionality */}}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Restablecer Contraseña
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}