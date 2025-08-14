"use client";

import React, { useState, useEffect } from 'react';
import SystemStatus from '@/components/SystemStatus';
import SuperAdminDashboard from '@/components/admin/SuperAdminDashboard';
import { useAuthStore } from '@/stores/auth';
import { 
  Plus,
  Users, 
  BarChart3, 
  CheckCircle,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { AdminStats, Activity, Event } from '@/types';
import { apiService } from '@/services/api';

// Importar los nuevos componentes modernos
import { SectionCards } from '@/components/dashboard/SectionCards';
import { ChartAreaInteractive } from '@/components/dashboard/ChartAreaInteractive';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardMetrics {
  totalEvents: number;
  totalUsers: number;
  totalReservations: number;
  todayCheckIns: number;
  activeEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  occupancyRate: number;
}

interface TopEvent {
  id: string;
  title: string;
  category: string;
  reservations: number;
  capacity: number;
  date: string;
  status: 'activo' | 'proximo' | 'completado';
  occupancyRate: number;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalEvents: 0,
    totalUsers: 0,
    totalReservations: 0,
    todayCheckIns: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    occupancyRate: 0
  });

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  // Cargar datos del dashboard
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🎯 AdminDashboard: Loading dashboard data...');
      
      // Hacer llamadas reales a la API
      const [adminStats, events] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getEvents()
      ]);
      
      console.log('✅ AdminDashboard: Admin stats:', adminStats);
      console.log('✅ AdminDashboard: Events:', events);
      
      // Calcular métricas del dashboard
      const activeEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        return eventDate >= today;
      }).length;
      
      const upcomingEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        return eventDate > today && eventDate <= nextWeek;
      }).length;
      
      const completedEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        return eventDate < today;
      }).length;
      
      const metrics: DashboardMetrics = {
        totalEvents: adminStats.total_events || events.length,
        totalUsers: adminStats.total_users || 0,
        totalReservations: adminStats.total_reservations || 0,
        todayCheckIns: adminStats.total_checkins || 0,
        activeEvents,
        upcomingEvents,
        completedEvents,
        occupancyRate: adminStats.total_reservations > 0 ? 
          (adminStats.total_checkins / adminStats.total_reservations * 100) : 0
      };
      
      console.log('✅ AdminDashboard: Calculated metrics:', metrics);

      // Generar top events basados en los eventos reales
      const topEvents: TopEvent[] = events.slice(0, 4).map(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        const reservations = Math.floor(Math.random() * event.capacity * 0.8) + 5; // Simulado
        
        return {
          id: event.id,
          title: event.title,
          category: event.category,
          reservations,
          capacity: event.capacity,
          date: event.date,
          status: eventDate > today ? 'proximo' : 'activo',
          occupancyRate: Math.round((reservations / event.capacity) * 100)
        };
      });

      console.log('✅ AdminDashboard: Top events:', topEvents);

      setMetrics(metrics);
      setTopEvents(topEvents);
    } catch (error) {
      console.error('🚨 AdminDashboard: Error loading dashboard data:', error);
      
      // Set fallback data on error
      setMetrics({
        totalEvents: 0,
        totalUsers: 0,
        totalReservations: 0,
        todayCheckIns: 0,
        activeEvents: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        occupancyRate: 0
      });
      setTopEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'activo':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'proximo':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completado':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Super Admin Dashboard - Show first for super_admin users */}
      {user?.role === 'super_admin' && (
        <SuperAdminDashboard />
      )}
      
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            Dashboard de Administración
          </h2>
          <p className="text-muted-foreground">
            Vista general del sistema y métricas principales
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* System Status */}
      <SystemStatus className="mb-6" />

      {/* Main Metrics Cards */}
      <SectionCards metrics={metrics} loading={loading} />

      {/* Chart and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <ChartAreaInteractive />
        </div>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Acceso rápido a las funciones principales
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/events/create">
                  <Plus className="h-6 w-6 mb-2" />
                  <span className="text-sm">Crear Evento</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/users">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-sm">Usuarios</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/reports">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Reportes</span>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-20 flex-col">
                <Link href="/admin/checkin">
                  <CheckCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm">Check-in</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}