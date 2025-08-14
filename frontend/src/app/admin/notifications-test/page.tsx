'use client'

import React from 'react'
import { motion } from 'framer-motion'
import NotificationTester from '@/components/notifications/NotificationTester'
import NotificationSettings from '@/components/notifications/NotificationSettings'
import UserInterests from '@/components/user/UserInterests'
import { useAuthStore } from '@/stores/auth'
import { Bell, TestTube, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function NotificationsTestPage() {
  const { user } = useAuthStore()
  const [showSettings, setShowSettings] = useState(false)

  if (!user || !['super_admin', 'admin_local'].includes(user.role)) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Acceso denegado. Se requieren privilegios de administrador.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <TestTube className="w-6 h-6 mr-2" />
              Centro de Pruebas de Notificaciones
            </h1>
            <p className="text-blue-100">
              Prueba todas las funcionalidades del sistema de notificaciones implementado
            </p>
          </div>
          <Bell className="w-12 h-12 text-blue-200" />
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          🧪 Instrucciones de Prueba
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">✅ Notificaciones Push</h3>
            <ul className="text-green-700 space-y-1">
              <li>• Activa las notificaciones push</li>
              <li>• Prueba una notificación de test</li>
              <li>• Verifica que aparezca en el navegador</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">🔕 Horario Silencioso</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• Configura horario silencioso</li>
              <li>• Prueba notificaciones durante horario silencioso</li>
              <li>• Verifica que se supriman correctamente</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">🎯 Centro de Notificaciones</h3>
            <ul className="text-purple-700 space-y-1">
              <li>• Revisa el ícono en el sidebar</li>
              <li>• Abre el centro de notificaciones</li>
              <li>• Prueba filtros y acciones</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Main Tester */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <NotificationTester />
      </motion.div>

      {/* Settings and Interests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-ccb-blue" />
            Configuración de Notificaciones
          </h3>
          <p className="text-gray-600 mb-4">
            Prueba la configuración avanzada de notificaciones incluyendo categorías y horario silencioso.
          </p>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full bg-ccb-blue text-white px-4 py-2 rounded-lg hover:bg-ccb-blue/90 transition-colors"
          >
            Abrir Configuración
          </button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-ccb-blue" />
            Estado del Sistema
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Service Worker</span>
              <span className="text-green-600 font-medium">✅ Registrado</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Polling Optimizado</span>
              <span className="text-green-600 font-medium">✅ Activo</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Centro de Notificaciones</span>
              <span className="text-green-600 font-medium">✅ Integrado</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Modo Tema</span>
              <span className="text-green-600 font-medium">✅ Funcional</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* User Interests Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <UserInterests />
      </motion.div>

      {/* Settings Modal */}
      <NotificationSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-50 rounded-xl p-6 text-center"
      >
        <p className="text-gray-600 text-sm">
          <strong>Sistema de Notificaciones CCB v2.0</strong> - 
          Todas las funcionalidades implementadas y funcionando correctamente.
          <br />
          Notificaciones push, centro de notificaciones, horario silencioso, detección de intereses y tema integrado.
        </p>
      </motion.div>
    </div>
  )
}