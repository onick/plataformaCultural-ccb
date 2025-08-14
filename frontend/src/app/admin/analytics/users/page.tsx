'use client';

import { UserMetricsChart } from '@/components/analytics';

export default function UserAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics de Usuarios
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Métricas detalladas de registro y actividad de usuarios
        </p>
      </div>
      
      <UserMetricsChart />
    </div>
  );
}