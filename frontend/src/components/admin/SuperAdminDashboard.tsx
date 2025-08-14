'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Users, 
  Building2, 
  BarChart3, 
  Bell, 
  Shield, 
  Database,
  Activity,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Eye,
  UserCheck
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useCenterStore } from '@/stores/centerStore'
import Link from 'next/link'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<any>
  color: string
  count?: number
}

interface SystemMetric {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  color: string
}

export default function SuperAdminDashboard() {
  const { user } = useAuthStore()
  const { availableCenters, setSelectedCenter } = useCenterStore()
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)

  // Only render for super_admin
  if (!user || user.role !== 'super_admin') {
    return null
  }

  const quickActions: QuickAction[] = [
    {
      title: 'Gestión Global de Usuarios',
      description: 'Administrar usuarios de todos los centros',
      href: '/admin/users',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Configuración de Centros',
      description: 'Gestionar centros y configuraciones globales',
      href: '/admin/centers',
      icon: Building2,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Analytics Consolidados',
      description: 'Ver métricas agregadas de todos los centros',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Notificaciones del Sistema',
      description: 'Gestionar notificaciones globales',
      href: '/admin/notifications',
      icon: Bell,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      title: 'Seguridad y Auditoría',
      description: 'Logs de actividad y seguridad',
      href: '/admin/security',
      icon: Shield,
      color: 'from-red-500 to-red-600'
    },
    {
      title: 'Estado del Sistema',
      description: 'Monitoreo de salud del sistema',
      href: '/admin/system-status',
      icon: Database,
      color: 'from-indigo-500 to-indigo-600'
    }
  ]

  const fetchSystemMetrics = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      
      // Fetch basic system metrics
      const response = await fetch('/api/dashboard/system-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSystemMetrics([
          {
            label: 'Estado de la Base de Datos',
            value: data.data?.database?.status === 'connected' ? 'Conectada' : 'Desconectada',
            color: data.data?.database?.status === 'connected' ? 'text-green-600' : 'text-red-600'
          },
          {
            label: 'Versión de la API',
            value: data.data?.api_version || 'N/A',
            color: 'text-blue-600'
          },
          {
            label: 'Centros Activos',
            value: availableCenters.length,
            color: 'text-purple-600'
          },
          {
            label: 'Última Actualización',
            value: new Date().toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            color: 'text-gray-600'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemMetrics()
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(fetchSystemMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [availableCenters])

  return (
    <div className="space-y-6">
      {/* Super Admin Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Panel de Super Administrador
            </h1>
            <p className="text-ccb-lightblue-100">
              Bienvenido, {user.nombre}. Tienes acceso completo al sistema.
            </p>
          </div>
          <Shield className="w-12 h-12 text-ccb-lightblue-200" />
        </div>
      </motion.div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-ccb-blue" />
          Estado del Sistema
        </h2>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className="text-center">
                <p className="text-sm text-gray-500 mb-1">{metric.label}</p>
                <p className={`text-lg font-semibold ${metric.color}`}>
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-ccb-blue" />
          Acciones Rápidas de Super Admin
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={action.href}
                  className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-md group"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 group-hover:text-ccb-blue transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {action.description}
                      </p>
                      {action.count !== undefined && (
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {action.count}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Center Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-ccb-blue" />
          Gestión Multi-Centro
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableCenters.map((center) => (
            <div
              key={center.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <h3 className="font-medium text-gray-900">{center.name}</h3>
                  <p className="text-sm text-gray-500">{center.city}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedCenter(center.id)}
                  className="p-2 text-gray-400 hover:text-ccb-blue transition-colors"
                  title="Ver centro"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <Link
                  href={`/admin/centers/${center.id}`}
                  className="p-2 text-gray-400 hover:text-ccb-blue transition-colors"
                  title="Configurar centro"
                >
                  <Settings className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-ccb-blue" />
          Actividad Reciente Global
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-700">Sistema funcionando correctamente</span>
            </div>
            <span className="text-xs text-gray-500">Hace 2 min</span>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-700">Backup automático completado</span>
            </div>
            <span className="text-xs text-gray-500">Hace 1 hora</span>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center space-x-3">
              <Calendar className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-700">Sincronización de centros exitosa</span>
            </div>
            <span className="text-xs text-gray-500">Hace 3 horas</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link
            href="/admin/activity-log"
            className="text-sm text-ccb-blue hover:text-ccb-blue/80 font-medium"
          >
            Ver log completo de actividad →
          </Link>
        </div>
      </motion.div>
    </div>
  )
}