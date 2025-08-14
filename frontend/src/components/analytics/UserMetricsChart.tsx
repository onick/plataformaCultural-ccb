'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Activity, TrendingUp } from 'lucide-react';
import { LineChart, AreaChart, ChartExport, DateRangeFilter } from '@/components/charts';
import { analyticsService, UserMetrics, UserRegistrationData, UserActivityData } from '@/services/analytics';

interface MetricCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {value.toLocaleString()}
          </p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>{change >= 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function UserMetricsChart() {
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [registrationData, setRegistrationData] = useState<UserRegistrationData[]>([]);
  const [activityData, setActivityData] = useState<UserActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, registrationData, activityData] = await Promise.all([
        analyticsService.getUserMetrics(),
        analyticsService.getUserRegistrationData(parseInt(timeRange)),
        analyticsService.getUserActivityData(parseInt(timeRange))
      ]);
      
      setMetrics(metricsData);
      setRegistrationData(registrationData);
      setActivityData(activityData);
    } catch (error) {
      console.error('Error loading user metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' }
  ];

  const chartControls = (
    <div className="flex flex-col sm:flex-row gap-3">
      <DateRangeFilter
        value={dateRange}
        onChange={setDateRange}
      />
      <ChartExport
        data={registrationData}
        title="Registros de Usuarios"
      />
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Usuarios"
          value={metrics.total_users}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Nuevos Este Mes"
          value={metrics.new_users_this_month}
          change={15.2}
          icon={<UserPlus className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Activos Hoy"
          value={metrics.active_users_today}
          change={-2.1}
          icon={<Activity className="w-6 h-6 text-white" />}
          color="bg-yellow-500"
        />
        <MetricCard
          title="Activos Este Mes"
          value={metrics.active_users_this_month}
          change={8.7}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations */}
        <LineChart
          title="Registros de Usuarios"
          subtitle="Nuevos usuarios registrados por día"
          data={registrationData}
          dataKeys={[
            { key: 'registrations', name: 'Registros Diarios', color: '#3B82F6' },
            { key: 'cumulative', name: 'Total Acumulado', color: '#10B981' }
          ]}
          xAxisKey="date"
          height={300}
          actions={chartControls}
        />

        {/* User Activity */}
        <AreaChart
          title="Actividad de Usuarios"
          subtitle="Usuarios activos, inicios de sesión y reservas"
          data={activityData}
          dataKeys={[
            { key: 'active_users', name: 'Usuarios Activos', color: '#8B5CF6' },
            { key: 'logins', name: 'Inicios de Sesión', color: '#06B6D4' },
            { key: 'reservations', name: 'Reservas', color: '#F59E0B' }
          ]}
          xAxisKey="date"
          height={300}
          stacked={true}
          actions={
            <ChartExport
              data={activityData}
              title="Actividad de Usuarios"
            />
          }
        />
      </div>
    </div>
  );
}