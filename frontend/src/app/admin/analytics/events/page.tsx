'use client';

import { EventMetricsChart } from '@/components/analytics';

export default function EventAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics de Eventos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas detalladas de eventos, reservas y popularidad
        </p>
      </div>
      
      <EventMetricsChart />
    </div>
  );
}