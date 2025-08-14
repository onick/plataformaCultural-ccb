'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Bell, Settings } from 'lucide-react'

interface SystemStatusProps {
  className?: string
}

export default function SystemStatus({ className = '' }: SystemStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [notifications, setNotifications] = useState(3)
  const [lastSync, setLastSync] = useState(new Date())

  useEffect(() => {
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update sync time every minute
    const syncInterval = setInterval(() => {
      setLastSync(new Date())
    }, 60000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(syncInterval)
    }
  }, [])

  const formatLastSync = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    
    if (diff < 1) return 'Ahora'
    if (diff === 1) return 'Hace 1 minuto'
    if (diff < 60) return `Hace ${diff} minutos`
    return date.toLocaleTimeString('es-DO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        ${className}
        bg-white rounded-xl border border-gray-200 shadow-sm p-4
        flex items-center justify-between space-x-4
      `}
    >
      {/* Connection Status */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          {isOnline ? (
            <Wifi size={20} className="text-green-500" />
          ) : (
            <WifiOff size={20} className="text-red-500" />
          )}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className={`
              absolute -top-1 -right-1 w-3 h-3 rounded-full
              ${isOnline ? 'bg-green-400' : 'bg-red-400'}
            `}
          />
        </div>
        
        <div>
          <p className="text-sm font-medium text-gray-900">
            {isOnline ? 'Conectado' : 'Sin conexión'}
          </p>
          <p className="text-xs text-gray-500">
            Última sync: {formatLastSync(lastSync)}
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Bell size={20} className="text-gray-400 hover:text-ccb-blue transition-colors cursor-pointer" />
          {notifications > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
            >
              {notifications > 9 ? '9+' : notifications}
            </motion.div>
          )}
        </div>

        <Settings 
          size={20} 
          className="text-gray-400 hover:text-ccb-blue transition-colors cursor-pointer" 
        />
      </div>
    </motion.div>
  )
}