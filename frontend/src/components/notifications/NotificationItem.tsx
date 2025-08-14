import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Calendar,
  Users,
  Settings,
  Clock
} from 'lucide-react';
import { Notification } from '@/stores/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  delay?: number;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ 
  notification, 
  onClick,
  delay = 0 
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getIconBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'info':
      default:
        return 'bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 'critical':
        return 'border-l-red-500';
      case 'high':
        return 'border-l-orange-500';
      case 'medium':
        return 'border-l-blue-500';
      case 'low':
      default:
        return 'border-l-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} h`;
    return time.toLocaleDateString('es-DO', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={`
        p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer border-l-4 
        ${getPriorityColor()}
        ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
      `}
    >
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
          ${getIconBgColor()}
        `}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`
                text-sm font-medium
                ${!notification.read 
                  ? 'text-gray-900 dark:text-white' 
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}>
                {notification.title}
              </h4>
              <p className={`
                text-sm mt-1 line-clamp-2
                ${!notification.read 
                  ? 'text-gray-600 dark:text-gray-400' 
                  : 'text-gray-500 dark:text-gray-500'
                }
              `}>
                {notification.message}
              </p>
              
              {/* Metadata */}
              <div className="flex items-center space-x-2 mt-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  {formatTimeAgo(notification.timestamp)}
                </span>
                
                {notification.category && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400 capitalize">
                      {notification.category}
                    </span>
                  </>
                )}
                
                {notification.priority !== 'low' && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full font-medium
                      ${notification.priority === 'critical' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        : notification.priority === 'high'
                        ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      }
                    `}>
                      {notification.priority}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Unread indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationItem;