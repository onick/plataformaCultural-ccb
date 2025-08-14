// Componentes inspirados en Upzet para CCB
export { MetricsCards } from './MetricsCards';
export { OverviewChart } from './OverviewChart';
export { NotificationPanel } from './NotificationPanel';

// Re-exportar tipos principales
export type { 
  DashboardMetrics, 
  PreviousMetrics, 
  MetricsCardsProps 
} from './MetricsCards';

// Tipos para otros componentes
export interface OverviewChartProps {
  className?: string;
}

export interface NotificationPanelProps {
  className?: string;
  maxHeight?: string;
}