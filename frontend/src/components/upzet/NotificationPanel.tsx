import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell,
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Star,
  Clock,
  X,
  ChevronRight
} from 'lucide-react';

// Tipos para las notificaciones
interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'event' | 'user' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  actionUrl?: string;
}

// Datos de ejemplo inspirados en Upzet
const generateNotifications = (): Notification[] => [
  {
    id: '1',
    type: 'success',
    title: 'Nueva Reserva Confirmada',
    message: 'Scott Elliott ha confirmado su reserva para "Exposición de Arte Moderno"',
    timestamp: '2025-01-15T14:30:00Z',
    read: false,
    avatar: '/avatars/scott-elliott.jpg'
  },
  {
    id: '2',
    type: 'event',
    title: 'Reunión de Equipo A',
    message: 'Reunión programada para las 9:15 AM - Revisión de eventos del mes',
    timestamp: '2025-01-15T09:00:00Z',
    read: false
  },
  {
    id: '3',
    type: 'user',
    title: 'Nuevo Usuario Registrado',
    message: 'Frank Martin se ha registrado en la plataforma',
    timestamp: '2025-01-15T08:54:00Z',
    read: true,
    avatar: '/avatars/frank-martin.jpg'
  },
  {
    id: '4',
    type: 'info',
    title: 'Actualización del Sistema',
    message: 'Se han implementado nuevas funcionalidades de análisis',
    timestamp: '2025-01-15T07:00:00Z',
    read: true
  },
  {
    id: '5',
    type: 'warning',
    title: 'Capacidad Casi Completa',
    message: 'El evento "Taller de Fotografía" está al 95% de su capacidad',
    timestamp: '2025-01-14T18:30:00Z',
    read: true
  },
  {
    id: '6',
    type: 'success',
    title: 'Check-in Exitoso',
    message: 'Terry Garrick ha realizado check-in para "Concierto de Jazz"',
    timestamp: '2025-01-14T16:45:00Z',
    read: true,
    avatar: '/avatars/terry-garrick.jpg'
  }
];

// Componente para el avatar o icono de la notificación
const NotificationIcon = ({ notification }: { notification: Notification }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-purple-600" />;
      case 'user':
        return <Users className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20';
      case 'event':
        return 'bg-purple-50 dark:bg-purple-900/20';
      case 'user':
        return 'bg-indigo-50 dark:bg-indigo-900/20';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (notification.avatar) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
        <img 
          src={notification.avatar} 
          alt={notification.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback si la imagen no carga
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className={`hidden w-full h-full ${getBackgroundColor()} flex items-center justify-center`}>
          {getIcon()}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full ${getBackgroundColor()} flex items-center justify-center`}>
      {getIcon()}
    </div>
  );
};

// Función para formatear el tiempo relativo
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `${diffInMinutes} min`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
  return time.toLocaleDateString('es-DO', { month: 'short', day: 'numeric' });
};

// Props del componente
interface NotificationPanelProps {
  className?: string;
  maxHeight?: string;
}

// Componente principal del panel de notificaciones
export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  className = '',
  maxHeight = 'max-h-96'
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const notifs = generateNotifications();
    setNotifications(notifs);
    setUnreadCount(notifs.filter(n => !n.read).length);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notif = prev.find(n => n.id === id);
      if (notif && !notif.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Bell className="w-5 h-5 text-ccb-blue" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notificaciones
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {/* Filtros */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-ccb-blue text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === 'unread'
                    ? 'bg-ccb-blue text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Sin leer ({unreadCount})
              </button>
            </div>

            {/* Marcar todas como leídas */}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-ccb-blue hover:text-ccb-blue/80 transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className={`${maxHeight} overflow-y-auto`}>
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 text-center"
            >
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'unread' ? 'No hay notificaciones sin leer' : 'No hay notificaciones'}
              </p>
            </motion.div>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0
                  hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group
                  ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
                `}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start space-x-3">
                  <NotificationIcon notification={notification} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.read 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          !notification.read 
                            ? 'text-gray-600 dark:text-gray-400' 
                            : 'text-gray-500 dark:text-gray-500'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>

                      {/* Indicador de no leído */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-ccb-blue rounded-full mt-2"></div>
                      )}
                    </div>
                  </div>

                  {/* Botón de eliminar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Flecha para acción */}
                  {notification.actionUrl && (
                    <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <button className="text-sm text-ccb-blue hover:text-ccb-blue/80 transition-colors font-medium">
            Ver todas las notificaciones →
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationPanel;