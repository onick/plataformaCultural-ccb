'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity,
  Clock,
  UserPlus,
  TicketIcon
} from 'lucide-react';
import { BarChart, LineChart, PieChart } from '@/components/charts';
import { analyticsService, DashboardMetrics } from '@/services/analytics';

interface QuickStatProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function QuickStat({ title, value, change, changeType = 'neutral', icon, color }: QuickStatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'positive' 
                ? 'text-green-600 dark:text-green-400' 
                : changeType === 'negative'
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{change}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function RecentActivity({ activities }: { activities: DashboardMetrics['recent_activity'] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <UserPlus className="w-4 h-4 text-green-600" />;
      case 'event_created':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'reservation_made':
        return <TicketIcon className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-blue-600" />
          Actividad Reciente
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No hay actividad reciente
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar datos
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error || 'No se pudieron cargar las métricas del dashboard'}
          </p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const userGrowthData = [
    { name: 'Ene', usuarios: 45 },
    { name: 'Feb', usuarios: 67 },
    { name: 'Mar', usuarios: 89 },
    { name: 'Abr', usuarios: 124 },
    { name: 'May', usuarios: 150 }
  ];

  const eventDistributionData = [
    { name: 'Música', value: 45 },
    { name: 'Teatro', value: 30 },
    { name: 'Arte', value: 15 },
    { name: 'Literatura', value: 10 }
  ];

  const monthlyReservationsData = [
    { name: 'Ene', reservas: 234 },
    { name: 'Feb', reservas: 345 },
    { name: 'Mar', reservas: 456 },
    { name: 'Abr', reservas: 567 },
    { name: 'May', reservas: 678 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard de Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas y estadísticas de la plataforma CCB
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStat
          title="Total de Usuarios"
          value={metrics.users.total_users.toLocaleString()}
          change="+15.2% este mes"
          changeType="positive"
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <QuickStat
          title="Eventos Activos"
          value={metrics.events.total_events.toLocaleString()}
          change="+8.7% este mes"
          changeType="positive"
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <QuickStat
          title="Reservas Totales"
          value={metrics.events.total_reservations.toLocaleString()}
          change="+12.3% este mes"
          changeType="positive"
          icon={<TicketIcon className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <QuickStat
          title="Usuarios Activos"
          value={metrics.users.active_users_this_month.toLocaleString()}
          change="-2.1% esta semana"
          changeType="negative"
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <LineChart
          title="Crecimiento de Usuarios"
          subtitle="Usuarios registrados por mes"
          data={userGrowthData}
          dataKeys={[
            { key: 'usuarios', name: 'Usuarios', color: '#3B82F6' }
          ]}
          height={250}
          className="lg:col-span-1"
        />

        <PieChart
          title="Distribución de Eventos"
          subtitle="Por categoría"
          data={eventDistributionData}
          height={250}
          className="lg:col-span-1"
        />

        <RecentActivity activities={metrics.recent_activity} />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Reservas Mensuales"
          subtitle="Evolución de reservas por mes"
          data={monthlyReservationsData}
          dataKeys={[
            { key: 'reservas', name: 'Reservas', color: '#10B981' }
          ]}
          height={300}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Resumen Semanal
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Nuevos usuarios:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                +{metrics.users.new_users_this_week}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Usuarios activos:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {metrics.users.active_users_this_week}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Reservas realizadas:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                +{Math.floor(metrics.events.reservations_this_month / 4)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Tasa de ocupación:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                87.5%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}