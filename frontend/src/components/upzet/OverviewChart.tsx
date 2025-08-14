import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Simulamos los datos del chart (en una implementación real vendría de la API)
const generateChartData = (timeRange: string) => {
  const dataPoints = timeRange === '1Y' ? 12 : timeRange === '6M' ? 26 : timeRange === '1M' ? 30 : 7;
  const baseEvents = 50;
  const baseReservations = 200;
  
  return Array.from({ length: dataPoints }, (_, i) => {
    const variation = Math.sin(i * 0.5) * 20 + Math.random() * 30;
    return {
      period: timeRange === '1Y' 
        ? `${['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i]}`
        : timeRange === '6M'
        ? `S${i + 1}`
        : timeRange === '1M'
        ? `${i + 1}`
        : `${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i]}`,
      eventos: Math.max(20, Math.round(baseEvents + variation)),
      reservas: Math.max(100, Math.round(baseReservations + variation * 4)),
      checkins: Math.max(50, Math.round((baseReservations + variation * 4) * 0.7))
    };
  });
};

// Componente para las barras del gráfico
const ChartBar = ({ 
  height, 
  color, 
  delay = 0, 
  isActive = false,
  label,
  value 
}: {
  height: number;
  color: string;
  delay?: number;
  isActive?: boolean;
  label: string;
  value: number;
}) => (
  <div className="relative group">
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: `${height}%` }}
      transition={{ delay, duration: 0.8, ease: "easeOut" }}
      className={`
        w-full rounded-t-sm transition-all duration-300 cursor-pointer
        ${isActive ? 'opacity-100 shadow-lg' : 'opacity-80 hover:opacity-100'}
      `}
      style={{ backgroundColor: color }}
    />
    
    {/* Tooltip */}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
      <div className="text-center">
        <div className="font-medium">{label}</div>
        <div>{value.toLocaleString()}</div>
      </div>
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
    </div>
  </div>
);

// Tipos para los props
interface OverviewChartProps {
  className?: string;
}

// Componente principal del chart inspirado en Upzet
export const OverviewChart: React.FC<OverviewChartProps> = ({ className = '' }) => {
  const [timeRange, setTimeRange] = useState('1M');
  const [activeMetric, setActiveMetric] = useState('reservas');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = useMemo(() => generateChartData(timeRange), [timeRange]);
  
  // Calcular valores máximos para normalizar las barras
  const maxValues = useMemo(() => ({
    eventos: Math.max(...data.map(d => d.eventos)),
    reservas: Math.max(...data.map(d => d.reservas)),
    checkins: Math.max(...data.map(d => d.checkins))
  }), [data]);

  // Configuración de métricas
  const metrics = [
    { 
      key: 'eventos', 
      label: 'Eventos', 
      color: '#003087',
      icon: '📅',
      total: data.reduce((sum, d) => sum + d.eventos, 0)
    },
    { 
      key: 'reservas', 
      label: 'Reservas', 
      color: '#0066CC',
      icon: '🎫',
      total: data.reduce((sum, d) => sum + d.reservas, 0)
    },
    { 
      key: 'checkins', 
      label: 'Check-ins', 
      color: '#FFD700',
      icon: '✅',
      total: data.reduce((sum, d) => sum + d.checkins, 0)
    }
  ];

  const timeRangeOptions = [
    { value: 'ALL', label: 'TODO' },
    { value: '1M', label: '1M' },
    { value: '6M', label: '6M' },
    { value: '1Y', label: '1A' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resumen General
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Análisis de rendimiento del centro cultural
            </p>
          </div>
          
          {/* Filtros de tiempo */}
          <div className="flex items-center space-x-2">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${timeRange === option.value
                    ? 'bg-ccb-blue text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6">
        {/* Métricas de resumen */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {metrics.map((metric) => (
            <motion.button
              key={metric.key}
              onClick={() => setActiveMetric(metric.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                p-4 rounded-lg border-2 transition-all duration-200 text-left
                ${activeMetric === metric.key
                  ? 'border-ccb-blue bg-ccb-blue/5 dark:bg-ccb-blue/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{metric.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {metric.label}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {metric.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="flex items-end space-x-2 h-64 mb-4">
            {data.map((point, index) => {
              const currentMetric = metrics.find(m => m.key === activeMetric);
              const value = point[activeMetric as keyof typeof point] as number;
              const height = (value / maxValues[activeMetric as keyof typeof maxValues]) * 100;
              
              return (
                <div
                  key={index}
                  className="flex-1 relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <ChartBar
                    height={height}
                    color={currentMetric?.color || '#003087'}
                    delay={index * 0.1}
                    isActive={hoveredIndex === index}
                    label={currentMetric?.label || ''}
                    value={value}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex space-x-2">
            {data.map((point, index) => (
              <div key={index} className="flex-1 text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {point.period}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer con estadísticas adicionales */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-ccb-blue"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Eventos
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {metrics[0].total.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">+12% vs anterior</p>
          </div>
          
          <div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-ccb-lightblue"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Reservas
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {metrics[1].total.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">+8% vs anterior</p>
          </div>
          
          <div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-ccb-gold"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Check-ins
              </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {metrics[2].total.toLocaleString()}
            </p>
            <p className="text-xs text-green-600">+15% vs anterior</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OverviewChart;