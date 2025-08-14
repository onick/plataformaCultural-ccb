import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
  eventId?: string;
  center?: string;
  actionUrl?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recentCount: number;
}

interface NotificationStore {
  // State
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  lastFetch: string | null;
  
  // Simplified polling state
  isPolling: boolean;
  pollingInterval: number;
  
  // Filters
  centerFilter: string | null;
  typeFilter: string | null;
  priorityFilter: string | null;
  searchQuery: string;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Simplified polling
  startPolling: () => void;
  stopPolling: () => void;
  
  // Filtering
  filterByCenter: (center: string | null) => void;
  filterByType: (type: string | null) => void;
  filterByPriority: (priority: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  // Getters
  getUnreadCount: () => number;
  getNotificationStats: () => NotificationStats;
  getFilteredNotifications: () => Notification[];
}

// Mock data for development
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    priority: 'medium',
    title: 'Componentes Upzet Implementados',
    message: 'Los nuevos componentes inspirados en Upzet se han integrado exitosamente',
    timestamp: new Date().toISOString(),
    read: false,
    category: 'system'
  },
  {
    id: '2',
    type: 'info',
    priority: 'low',
    title: 'Nueva Reserva',
    message: 'Usuario ha realizado una nueva reserva para "Exposición de Arte"',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
    category: 'booking'
  },
  {
    id: '3',
    type: 'warning',
    priority: 'high',
    title: 'Capacidad Casi Completa',
    message: 'El evento "Taller de Fotografía" está al 95% de su capacidad',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: true,
    category: 'event'
  }
];

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      notifications: mockNotifications,
      isLoading: false,
      error: null,
      lastFetch: null,
      
      // Polling state
      isPolling: false,
      pollingInterval: 30000, // 30 seconds
      
      // Filters
      centerFilter: null,
      typeFilter: null,
      priorityFilter: null,
      searchQuery: '',
      
      // Actions
      setNotifications: (notifications) => {
        set({ 
          notifications, 
          lastFetch: new Date().toISOString(),
          error: null 
        });
      },
      
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
      },
      
      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      
      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true }))
        }));
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearAll: () => {
        set({ notifications: [] });
      },
      
      // Simplified polling without recursive calls
      startPolling: () => {
        console.log('Starting notification polling...');
        set({ isPolling: true });
      },
      
      stopPolling: () => {
        console.log('Stopping notification polling...');
        set({ isPolling: false });
      },
      
      // Filtering
      filterByCenter: (center) => {
        set({ centerFilter: center });
      },
      
      filterByType: (type) => {
        set({ typeFilter: type });
      },
      
      filterByPriority: (priority) => {
        set({ priorityFilter: priority });
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },
      
      // Getters
      getUnreadCount: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.read).length;
      },
      
      getNotificationStats: () => {
        const { notifications } = get();
        const stats: NotificationStats = {
          total: notifications.length,
          unread: notifications.filter(n => !n.read).length,
          byType: {},
          byPriority: {},
          recentCount: notifications.filter(n => {
            const notifTime = new Date(n.timestamp);
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            return notifTime > hourAgo;
          }).length
        };
        
        // Count by type
        notifications.forEach(n => {
          stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
        });
        
        // Count by priority
        notifications.forEach(n => {
          stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
        });
        
        return stats;
      },
      
      getFilteredNotifications: () => {
        const { 
          notifications, 
          centerFilter, 
          typeFilter, 
          priorityFilter, 
          searchQuery 
        } = get();
        
        return notifications.filter(n => {
          // Center filter
          if (centerFilter && n.center !== centerFilter) return false;
          
          // Type filter
          if (typeFilter && n.type !== typeFilter) return false;
          
          // Priority filter
          if (priorityFilter && n.priority !== priorityFilter) return false;
          
          // Search query
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              n.title.toLowerCase().includes(query) ||
              n.message.toLowerCase().includes(query)
            );
          }
          
          return true;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      }
    }),
    {
      name: 'notification-store'
    }
  )
);

export default useNotificationStore;