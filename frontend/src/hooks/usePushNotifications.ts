import { useEffect, useState } from 'react'
import { useNotificationStore } from '@/stores/notifications'

interface PushNotificationSupport {
  isSupported: boolean
  permission: NotificationPermission
  isServiceWorkerRegistered: boolean
  isSubscribed: boolean
}

export const usePushNotifications = () => {
  const [support, setSupport] = useState<PushNotificationSupport>({
    isSupported: false,
    permission: 'default',
    isServiceWorkerRegistered: false,
    isSubscribed: false
  })

  const { registerForPush, unregisterFromPush, addNotification } = useNotificationStore()

  // Check support and permission status
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
      const permission = Notification.permission
      
      let isServiceWorkerRegistered = false
      let isSubscribed = false

      if (isSupported) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          isServiceWorkerRegistered = !!registration
          
          if (registration) {
            const subscription = await registration.pushManager.getSubscription()
            isSubscribed = !!subscription
          }
        } catch (error) {
          console.error('Error checking service worker:', error)
        }
      }

      setSupport({
        isSupported,
        permission,
        isServiceWorkerRegistered,
        isSubscribed
      })
    }

    checkSupport()
  }, [])

  // Register service worker
  const registerServiceWorker = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service workers not supported')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      console.log('Service Worker registered:', registration)

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      setSupport(prev => ({ ...prev, isServiceWorkerRegistered: true }))
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('Message from service worker:', event.data)
        
        if (event.data.type === 'NOTIFICATION_CLICKED') {
          // Handle notification click
          console.log('Notification clicked:', event.data.data)
        }
      })

      return true
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  // Request notification permission
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return 'denied'
    }

    try {
      const permission = await Notification.requestPermission()
      setSupport(prev => ({ ...prev, permission }))
      return permission
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return 'denied'
    }
  }

  // Enable push notifications (complete flow)
  const enablePushNotifications = async (): Promise<boolean> => {
    try {
      // Step 1: Register service worker
      const swRegistered = await registerServiceWorker()
      if (!swRegistered) {
        throw new Error('Failed to register service worker')
      }

      // Step 2: Request permission
      const permission = await requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }

      // Step 3: Subscribe to push notifications
      const subscribed = await registerForPush()
      if (!subscribed) {
        throw new Error('Failed to subscribe to push notifications')
      }

      setSupport(prev => ({ ...prev, isSubscribed: true }))

      // Show success notification
      addNotification({
        title: '🔔 Notificaciones Activadas',
        message: 'Ahora recibirás notificaciones importantes del Centro Cultural',
        type: 'success',
        priority: 'medium'
      })

      return true
    } catch (error) {
      console.error('Failed to enable push notifications:', error)
      
      // Show error notification
      addNotification({
        title: '❌ Error en Notificaciones',
        message: 'No se pudieron habilitar las notificaciones push',
        type: 'error',
        priority: 'medium'
      })

      return false
    }
  }

  // Disable push notifications
  const disablePushNotifications = async (): Promise<boolean> => {
    try {
      const success = await unregisterFromPush()
      
      if (success) {
        setSupport(prev => ({ ...prev, isSubscribed: false }))
        
        addNotification({
          title: '🔕 Notificaciones Desactivadas',
          message: 'Ya no recibirás notificaciones push',
          type: 'info',
          priority: 'low'
        })
      }

      return success
    } catch (error) {
      console.error('Failed to disable push notifications:', error)
      return false
    }
  }

  // Send test notification
  const sendTestNotification = async (): Promise<void> => {
    if (support.permission !== 'granted') {
      console.warn('Notification permission not granted')
      return
    }

    try {
      // Create browser notification
      const notification = new Notification('🧪 Notificación de Prueba', {
        body: 'Esta es una notificación de prueba del Centro Cultural Banreservas',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
        data: {
          type: 'test',
          timestamp: Date.now()
        }
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      // Add to notification center
      addNotification({
        title: '🧪 Notificación de Prueba',
        message: 'Esta es una notificación de prueba del Centro Cultural Banreservas',
        type: 'info',
        priority: 'low',
        metadata: {
          source: 'test',
          timestamp: Date.now()
        }
      })

      console.log('Test notification sent')
    } catch (error) {
      console.error('Failed to send test notification:', error)
      
      addNotification({
        title: '❌ Error en Prueba',
        message: 'No se pudo enviar la notificación de prueba',
        type: 'error',
        priority: 'medium'
      })
    }
  }

  // Check if notifications are blocked
  const areNotificationsBlocked = (): boolean => {
    return support.permission === 'denied'
  }

  // Get detailed status
  const getStatus = () => {
    if (!support.isSupported) {
      return {
        status: 'unsupported' as const,
        message: 'Las notificaciones push no son compatibles con este navegador'
      }
    }

    if (support.permission === 'denied') {
      return {
        status: 'blocked' as const,
        message: 'Las notificaciones están bloqueadas. Habilítalas en la configuración del navegador.'
      }
    }

    if (!support.isServiceWorkerRegistered) {
      return {
        status: 'service-worker-needed' as const,
        message: 'Necesita registrar el service worker para recibir notificaciones'
      }
    }

    if (support.permission === 'default') {
      return {
        status: 'permission-needed' as const,
        message: 'Necesita dar permisos para recibir notificaciones'
      }
    }

    if (!support.isSubscribed) {
      return {
        status: 'subscription-needed' as const,
        message: 'Necesita suscribirse para recibir notificaciones push'
      }
    }

    return {
      status: 'ready' as const,
      message: 'Las notificaciones push están activas y funcionando'
    }
  }

  return {
    support,
    enablePushNotifications,
    disablePushNotifications,
    sendTestNotification,
    requestPermission,
    registerServiceWorker,
    areNotificationsBlocked,
    getStatus
  }
}