'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Bell, Mail, Smartphone, Clock, Volume2, VolumeX } from 'lucide-react'
import { useNotificationStore } from '@/stores/notifications'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { settings, updateSettings, registerForPush, unregisterFromPush } = useNotificationStore()

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const success = await registerForPush()
      if (success) {
        updateSettings({ enablePush: true })
      } else {
        // Show error message
        console.error('Failed to enable push notifications')
      }
    } else {
      const success = await unregisterFromPush()
      if (success) {
        updateSettings({ enablePush: false })
      }
    }
  }

  const handleCategoryToggle = (category: keyof typeof settings.categories, enabled: boolean) => {
    updateSettings({
      categories: {
        ...settings.categories,
        [category]: enabled
      }
    })
  }

  const handleQuietHoursToggle = (enabled: boolean) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        enabled
      }
    })
  }

  const handleQuietHoursChange = (field: 'start' | 'end', value: string) => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        [field]: value
      }
    })
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-ccb-blue" />
            Configuración de Notificaciones
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Personaliza cómo y cuándo recibir notificaciones
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tipos de Notificación</h3>
            
            <div className="space-y-4">
              {/* Push Notifications */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones Push</p>
                    <p className="text-sm text-gray-600">Recibe notificaciones en tu dispositivo</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enablePush}
                    onChange={(e) => handlePushToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ccb-blue"></div>
                </label>
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-green-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones por Email</p>
                    <p className="text-sm text-gray-600">Recibe emails importantes</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableEmail}
                    onChange={(e) => updateSettings({ enableEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ccb-blue"></div>
                </label>
              </div>

              {/* In-App Notifications */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Bell className="w-5 h-5 text-purple-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Notificaciones en la App</p>
                    <p className="text-sm text-gray-600">Ver notificaciones dentro de la aplicación</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableInApp}
                    onChange={(e) => updateSettings({ enableInApp: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ccb-blue"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Categorías</h3>
            
            <div className="space-y-3">
              {Object.entries(settings.categories).map(([category, enabled]) => {
                const categoryInfo = {
                  events: { label: 'Eventos', description: 'Nuevos eventos y actualizaciones' },
                  reservations: { label: 'Reservas', description: 'Confirmaciones y recordatorios' },
                  system: { label: 'Sistema', description: 'Actualizaciones y mantenimiento' },
                  marketing: { label: 'Marketing', description: 'Promociones y ofertas especiales' },
                }

                return (
                  <div key={category} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {categoryInfo[category as keyof typeof categoryInfo].label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {categoryInfo[category as keyof typeof categoryInfo].description}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => handleCategoryToggle(category as keyof typeof settings.categories, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ccb-blue"></div>
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              {settings.quietHours.enabled ? (
                <VolumeX className="w-5 h-5 text-orange-500 mr-2" />
              ) : (
                <Volume2 className="w-5 h-5 text-gray-400 mr-2" />
              )}
              Horario Silencioso
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Activar horario silencioso</p>
                  <p className="text-sm text-gray-600">No mostrar notificaciones durante estas horas</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.quietHours.enabled}
                    onChange={(e) => handleQuietHoursToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ccb-blue"></div>
                </label>
              </div>

              {settings.quietHours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ccb-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-ccb-blue focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}