import { apiService } from './api';

export interface UserMetrics {
  total_users: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
  active_users_today: number;
  active_users_this_week: number;
  active_users_this_month: number;
}

export interface UserRegistrationData {
  date: string;
  registrations: number;
  cumulative: number;
}

export interface UserActivityData {
  date: string;
  active_users: number;
  logins: number;
  reservations: number;
}

export interface EventMetrics {
  total_events: number;
  events_this_month: number;
  total_reservations: number;
  reservations_this_month: number;
  most_popular_events: Array<{
    id: string;
    title: string;
    reservations: number;
    capacity: number;
    utilization_rate: number;
  }>;
}

export interface EventReservationData {
  date: string;
  reservations: number;
  events: number;
}

export interface EventCategoryData {
  category: string;
  events: number;
  reservations: number;
  avg_utilization: number;
}

export interface DashboardMetrics {
  users: UserMetrics;
  events: EventMetrics;
  recent_activity: Array<{
    type: 'user_registered' | 'event_created' | 'reservation_made';
    message: string;
    timestamp: string;
  }>;
}

class AnalyticsService {
  async getUserMetrics(): Promise<UserMetrics> {
    try {
      const response = await apiService.get('/admin/analytics/users/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching user metrics:', error);
      // Return mock data for development
      return {
        total_users: 150,
        new_users_today: 5,
        new_users_this_week: 23,
        new_users_this_month: 87,
        active_users_today: 45,
        active_users_this_week: 89,
        active_users_this_month: 132
      };
    }
  }

  async getUserRegistrationData(days: number = 30): Promise<UserRegistrationData[]> {
    try {
      const response = await apiService.get(`/admin/analytics/users/registrations?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user registration data:', error);
      // Return mock data for development
      const mockData: UserRegistrationData[] = [];
      const today = new Date();
      let cumulative = 50;
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const registrations = Math.floor(Math.random() * 10) + 1;
        cumulative += registrations;
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          registrations,
          cumulative
        });
      }
      
      return mockData;
    }
  }

  async getUserActivityData(days: number = 30): Promise<UserActivityData[]> {
    try {
      const response = await apiService.get(`/admin/analytics/users/activity?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      // Return mock data for development
      const mockData: UserActivityData[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          active_users: Math.floor(Math.random() * 50) + 20,
          logins: Math.floor(Math.random() * 80) + 30,
          reservations: Math.floor(Math.random() * 25) + 5
        });
      }
      
      return mockData;
    }
  }

  async getEventMetrics(): Promise<EventMetrics> {
    try {
      const response = await apiService.get('/admin/analytics/events/metrics');
      return response.data;
    } catch (error) {
      console.error('Error fetching event metrics:', error);
      // Return mock data for development
      return {
        total_events: 45,
        events_this_month: 12,
        total_reservations: 890,
        reservations_this_month: 234,
        most_popular_events: [
          {
            id: '1',
            title: 'Concierto de Jazz',
            reservations: 95,
            capacity: 100,
            utilization_rate: 95
          },
          {
            id: '2',
            title: 'Exposición de Arte Moderno',
            reservations: 78,
            capacity: 80,
            utilization_rate: 97.5
          },
          {
            id: '3',
            title: 'Obra de Teatro',
            reservations: 120,
            capacity: 150,
            utilization_rate: 80
          }
        ]
      };
    }
  }

  async getEventReservationData(days: number = 30): Promise<EventReservationData[]> {
    try {
      const response = await apiService.get(`/admin/analytics/events/reservations?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching event reservation data:', error);
      // Return mock data for development
      const mockData: EventReservationData[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          reservations: Math.floor(Math.random() * 30) + 10,
          events: Math.floor(Math.random() * 5) + 1
        });
      }
      
      return mockData;
    }
  }

  async getEventCategoryData(): Promise<EventCategoryData[]> {
    try {
      const response = await apiService.get('/admin/analytics/events/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching event category data:', error);
      // Return mock data for development
      return [
        {
          category: 'Música',
          events: 15,
          reservations: 450,
          avg_utilization: 85.2
        },
        {
          category: 'Teatro',
          events: 12,
          reservations: 280,
          avg_utilization: 78.9
        },
        {
          category: 'Arte',
          events: 8,
          reservations: 160,
          avg_utilization: 92.1
        },
        {
          category: 'Literatura',
          events: 6,
          reservations: 95,
          avg_utilization: 65.4
        },
        {
          category: 'Danza',
          events: 4,
          reservations: 120,
          avg_utilization: 88.7
        }
      ];
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const [userMetrics, eventMetrics] = await Promise.all([
        this.getUserMetrics(),
        this.getEventMetrics()
      ]);

      // Recent activity mock data
      const recent_activity = [
        {
          type: 'user_registered' as const,
          message: 'Nuevo usuario María González se registró',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          type: 'reservation_made' as const,
          message: 'Nueva reserva para "Concierto de Jazz"',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          type: 'event_created' as const,
          message: 'Evento "Taller de Pintura" creado',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ];

      return {
        users: userMetrics,
        events: eventMetrics,
        recent_activity
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();