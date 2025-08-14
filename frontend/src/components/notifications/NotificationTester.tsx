'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  BellOff, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Info,
  Zap,
  Settings,
  RefreshCw
} from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useNotificationStore } from '@/stores/notifications'

export default function NotificationTester() {
  const [isLoading, setIsLoading] = useState(false)
  const { 
    support, 
    enablePushNotifications, 
    disablePushNotifications, 
    sendTestNotification,
    getStatus 
  } = usePushNotifications()
  
  const { addNotification } = useNotificationStore()
  const status = getStatus()

  const getStatusIcon = () => {
    switch (status.status) {
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'unsupported':
        return <XCircle className="w-5 h-5 text-gray-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = () => {
    switch (status.status) {
      case 'ready':
        return 'border-green-200 bg-green-50'
      case 'blocked':
        return 'border-red-200 bg-red-50'
      case 'unsupported':
        return 'border-gray-200 bg-gray-50'
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  const handleEnableNotifications = async () => {
    setIsLoading(true)
    try {
      const success = await enablePushNotifications()
      if (success) {
        console.log('✅ Push notifications enabled successfully')
      }
    } catch (error) {
      console.error('❌ Failed to enable push notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisableNotifications = async () => {
    setIsLoading(true)
    try {
      const success = await disablePushNotifications()
      if (success) {
        console.log('✅ Push notifications disabled successfully')
      }
    } catch (error) {
      console.error('❌ Failed to disable push notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    setIsLoading(true)
    try {
      await sendTestNotification()
      console.log('✅ Test notification sent')
    } catch (error) {
      console.error('❌ Failed to send test notification:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testQuietHours = () => {
    const { settings } = useNotificationStore.getState()
    
    if (!settings.quietHours.enabled) {
      addNotification({
        title: '🌙 Horario Silencioso Desactivado',
        message: 'El horario silencioso no está activado. Ve a configuración para habilitarlo.',
        type: 'info',
        priority: 'low'
      })
      return
    }

    const now = new Date()
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0')
    
    const isQuietTime = currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end
    
    addNotification({
      title: isQuietTime ? '🤫 Horario Silencioso Activo' : '🔔 Horario Normal',
      message: isQuietTime 
        ? `Estamos en horario silencioso (${settings.quietHours.start} - ${settings.quietHours.end}). Las notificaciones push están silenciadas.`
        : `Horario normal. Las notificaciones push se muestran normalmente.`,
      type: isQuietTime ? 'info' : 'success',
      priority: 'medium'
    })
  }

  const testCategories = () => {
    const categories = [
      { key: 'events', name: 'Eventos', icon: '📅' },
      { key: 'reservations', name: 'Reservas', icon: '🎫' },
      { key: 'system', name: 'Sistema', icon: '⚙️' },
      { key: 'marketing', name: 'Marketing', icon: '📢' }
    ]

    categories.forEach((cat, index) => {
      setTimeout(() => {
        addNotification({
          title: `${cat.icon} Prueba: ${cat.name}`,
          message: `Esta es una notificación de prueba para la categoría ${cat.name}`,
          type: 'info',
          priority: 'low',
          metadata: {
            category: cat.key,
            test: true
          }
        })
      }, index * 1000) // Espaciar las notificaciones
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TestTube className="w-5 h-5 mr-2 text-ccb-blue" />
          Prueba de Notificaciones
        </h3>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          title="Recargar estado"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status Card */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-3 mb-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">
            Estado: {status.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-600">{status.message}</p>
        
        {/* Support Details */}
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className={`flex items-center ${support.isSupported ? 'text-green-600' : 'text-red-600'}`}>
            {support.isSupported ? '✅' : '❌'} Navegador Compatible
          </div>
          <div className={`flex items-center ${support.permission === 'granted' ? 'text-green-600' : 'text-yellow-600'}`}>
            {support.permission === 'granted' ? '✅' : '⚠️'} Permisos: {support.permission}
          </div>
          <div className={`flex items-center ${support.isServiceWorkerRegistered ? 'text-green-600' : 'text-yellow-600'}`}>
            {support.isServiceWorkerRegistered ? '✅' : '⚠️'} Service Worker
          </div>
          <div className={`flex items-center ${support.isSubscribed ? 'text-green-600' : 'text-yellow-600'}`}>
            {support.isSubscribed ? '✅' : '⚠️'} Suscrito
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Enable/Disable */}
        <div className="space-y-2">
          {support.isSubscribed ? (
            <button
              onClick={handleDisableNotifications}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <BellOff className="w-4 h-4" />
              <span>{isLoading ? 'Desactivando...' : 'Desactivar Push'}</span>
            </button>
          ) : (
            <button
              onClick={handleEnableNotifications}
              disabled={isLoading || status.status === 'unsupported'}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span>{isLoading ? 'Activando...' : 'Activar Push'}</span>
            </button>
          )}
        </div>

        {/* Test Notification */}
        <button
          onClick={handleTestNotification}
          disabled={isLoading || support.permission !== 'granted'}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Zap className="w-4 h-4" />
          <span>{isLoading ? 'Enviando...' : 'Prueba Push'}</span>
        </button>
      </div>

      {/* Additional Tests */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Pruebas Adicionales
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={testQuietHours}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
          >
            <span>🌙</span>
            <span>Probar Horario Silencioso</span>
          </button>
          
          <button
            onClick={testCategories}
            className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <span>📂</span>
            <span>Probar Categorías</span>
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <strong>Nota:</strong> Para recibir notificaciones push reales, necesitas dar permisos al navegador, 
        tener el service worker registrado y estar suscrito al servicio push. 
        Las pruebas funcionan tanto para notificaciones del navegador como del centro de notificaciones.
      </div>
    </motion.div>
  )
}