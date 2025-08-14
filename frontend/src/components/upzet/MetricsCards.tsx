import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  Ticket, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  BarChart3,
  CheckCircle
} from 'lucide-react';

// Componente de gráfico radial inspirado en Upzet
const RadialProgress = ({ value, size = 60, strokeWidth = 6, color = "#003087" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-600"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
    </div>
  );
};

// Componente individual de métrica inspirado en Upzet
const MetricCard = ({ 
  title, 
  value, 
  previousValue, 
  icon: Icon, 
  color, 
  bgColor, 
  showRadial = true,
  delay = 0,
  suffix = '',
  subtitle = ''
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const changePercentage = previousValue ? ((value - previousValue) / previousValue * 100).toFixed(1) : '0';
  const isPositive = parseFloat(changePercentage) >= 0;

  // Animación del contador
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let currentValue = 0;
    
    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(currentValue));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  // Calcular porcentaje para el gráfico radial
  const maxValue = Math.max(value, previousValue || value) * 1.2;
  const radialValue = Math.min((value / maxValue) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div 
              className="p-3 rounded-lg transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: bgColor }}
            >
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            {showRadial && (
              <RadialProgress 
                value={radialValue} 
                size={55} 
                color={color}
              />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {displayValue.toLocaleString()}{suffix}
            </p>
            <div className="flex items-center space-x-1">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span 
                className={`text-sm font-medium ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isPositive ? '+' : ''}{changePercentage}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {subtitle || 'vs anterior'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Interfaz para las métricas
interface DashboardMetrics {
  totalEvents: number;
  totalUsers: number;
  totalReservations: number;
  todayCheckIns: number;
  occupancyRate: number;
}

interface PreviousMetrics {
  totalEvents: number;
  totalUsers: number;
  totalReservations: number;
  todayCheckIns: number;
}

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  previousMetrics?: PreviousMetrics;
  loading?: boolean;
}

// Componente principal de las cards inspirado en Upzet
export const MetricsCards: React.FC<MetricsCardsProps> = ({ 
  metrics, 
  previousMetrics,
  loading = false 
}) => {
  const cardsData = [
    {
      title: "Total Eventos",
      value: metrics.totalEvents,
      previousValue: previousMetrics?.totalEvents || metrics.totalEvents * 0.9,
      icon: Calendar,
      color: "#003087", // CCB Blue
      bgColor: "#E6F3FF",
      subtitle: "este mes"
    },
    {
      title: "Usuarios Activos",
      value: metrics.totalUsers,
      previousValue: previousMetrics?.totalUsers || metrics.totalUsers * 0.95,
      icon: Users,
      color: "#6B46C1", // Purple
      bgColor: "#F3F0FF",
      subtitle: "registrados"
    },
    {
      title: "Total Reservas",
      value: metrics.totalReservations,
      previousValue: previousMetrics?.totalReservations || metrics.totalReservations * 0.88,
      icon: Ticket,
      color: "#059669", // Green
      bgColor: "#ECFDF5",
      subtitle: "confirmadas"
    },
    {
      title: "Tasa Ocupación",
      value: Math.round(metrics.occupancyRate),
      previousValue: Math.round((previousMetrics?.todayCheckIns || metrics.todayCheckIns * 0.9) / (metrics.totalReservations || 1) * 100),
      icon: BarChart3,
      color: "#DC2626", // Red
      bgColor: "#FEF2F2",
      suffix: "%",
      subtitle: "promedio"
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cardsData.map((card, index) => (
        <MetricCard
          key={card.title}
          title={card.title}
          value={card.value}
          previousValue={card.previousValue}
          icon={card.icon}
          color={card.color}
          bgColor={card.bgColor}
          suffix={card.suffix}
          subtitle={card.subtitle}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
};

export default MetricsCards;