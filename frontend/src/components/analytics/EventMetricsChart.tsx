'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Star } from 'lucide-react';
import { BarChart, PieChart, LineChart } from '@/components/charts';
import { analyticsService, EventMetrics, EventReservationData, EventCategoryData } from '@/services/analytics';

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

function PopularEventsList({ events }: { events: EventMetrics['most_popular_events'] }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <Star className="w-5 h-5 mr-2 text-yellow-500" />
          Eventos Más Populares
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Basado en reservas y tasa de ocupación
        </p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    #{index + 1}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {event.reservations} de {event.capacity} reservas
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {event.utilization_rate.toFixed(1)}%
                </div>
                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${event.utilization_rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function EventMetricsChart() {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [reservationData, setReservationData] = useState<EventReservationData[]>([]);
  const [categoryData, setCategoryData] = useState<EventCategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, reservationData, categoryData] = await Promise.all([
        analyticsService.getEventMetrics(),
        analyticsService.getEventReservationData(parseInt(timeRange)),
        analyticsService.getEventCategoryData()
      ]);
      
      setMetrics(metricsData);
      setReservationData(reservationData);
      setCategoryData(categoryData);
    } catch (error) {
      console.error('Error loading event metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeRangeOptions = [
    { value: '7', label: '7 días' },
    { value: '30', label: '30 días' },
    { value: '90', label: '90 días' }
  ];

  const timeRangeSelector = (
    <select
      value={timeRange}
      onChange={(e) => setTimeRange(e.target.value as '7' | '30' | '90')}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
    >
      {timeRangeOptions.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  // Transform category data for pie chart
  const categoryChartData = categoryData.map(item => ({
    name: item.category,
    value: item.reservations
  }));

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
          title="Total de Eventos"
          value={metrics.total_events}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Eventos Este Mes"
          value={metrics.events_this_month}
          change={12.5}
          icon={<Calendar className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Reservas"
          value={metrics.total_reservations}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Reservas Este Mes"
          value={metrics.reservations_this_month}
          change={8.3}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservations Timeline */}
        <LineChart
          title="Evolución de Reservas"
          subtitle="Reservas y eventos por día"
          data={reservationData}
          dataKeys={[
            { key: 'reservations', name: 'Reservas', color: '#3B82F6' },
            { key: 'events', name: 'Eventos', color: '#10B981' }
          ]}
          xAxisKey="date"
          height={300}
          actions={timeRangeSelector}
        />

        {/* Category Distribution */}
        <PieChart
          title="Distribución por Categoría"
          subtitle="Reservas por tipo de evento"
          data={categoryChartData}
          height={300}
          showLegend={true}
        />
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Rendimiento por Categoría"
          subtitle="Eventos y utilización promedio"
          data={categoryData}
          dataKeys={[
            { key: 'events', name: 'Eventos', color: '#3B82F6' },
            { key: 'avg_utilization', name: 'Utilización (%)', color: '#F59E0B' }
          ]}
          xAxisKey="category"
          height={300}
        />

        {/* Popular Events */}
        <PopularEventsList events={metrics.most_popular_events} />
      </div>
    </div>
  );
}