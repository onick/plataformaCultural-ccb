/**
 * API Service - Central API client for CCB Platform
 * Handles all communication with the FastAPI backend
 */

import { categoryToEnglish, categoryToSpanish } from '@/utils/eventUtils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004';

interface ApiResponse<T = any> {
  message: string;
  data?: T;
  success?: boolean;
}

interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  capacity: number;
  location: string;
  image_url?: string;
  price?: number;
  tags?: string[];
  requirements?: string;
  contact_info?: any;
  published?: boolean;
  available_spots?: number;
  created_at: string;
  updated_at?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  location?: string;
  is_admin: boolean;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
  total_reservations?: number;
  attended_events?: number;
  attendance_rate?: number;
  last_activity?: string;
  status?: 'active' | 'inactive' | 'admin' | 'deleted';
}

interface UserProfileUpdate {
  name?: string;
  phone?: string;
  age?: number;
  location?: string;
  bio?: string;
  avatar_url?: string;
}

interface Reservation {
  id: string;
  event_id: string;
  codigo_reserva: string;
  numero_asistentes: number;
  estado: 'confirmed' | 'checked_in' | 'cancelled' | 'no_show';
  created_at: string;
  fecha_checkin?: string;
  notes?: string;
  event?: {
    id: string;
    title: string;
    description: string;
    category: string;
    date: string;
    time: string;
    location: string;
    image_url?: string;
  };
}

interface UserStats {
  total_reservations: number;
  attended_events: number;
  upcoming_reservations: number;
  canceled_reservations: number;
  attendance_rate: number;
  favorite_categories: string[];
}

interface UserCreate {
  name: string;
  email: string;
  password: string;
  phone?: string;
  age?: number;
  location?: string;
  is_admin?: boolean;
}

interface UserUpdate {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  location?: string;
  is_admin?: boolean;
}

interface UsersResponse {
  users: User[];
  total: number;
  skip: number;
  limit: number;
}

interface EventCreate {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  capacity: number;
  location: string;
  image_url?: string;
  price?: number;
  tags?: string[];
  requirements?: string;
  contact_info?: any;
  published?: boolean;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders: any = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    // Get token from localStorage if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
      console.log('Using token for', endpoint, ':', token.substring(0, 20) + '...');
    } else {
      console.log('No token found for', endpoint);
    }

    try {
      console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
      console.log('📤 Request Headers:', defaultHeaders);
      if (options.body) {
        console.log('📤 Request Body:', options.body);
      }

      const response = await fetch(url, {
        ...options,
        headers: defaultHeaders
      });

      console.log(`📥 Response Status: ${response.status} ${response.statusText}`);
      console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        if (response.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          const errorMsg = `401 Unauthorized - Redirecting to login`;
          console.error('🚨 Auth Error:', errorMsg);
          if (window.logError) {
            window.logError(errorMsg, `API Request: ${endpoint}`, {
              status: response.status,
              url,
              headers: defaultHeaders
            });
          }
          window.location.href = '/auth/login';
          throw new Error('Unauthorized');
        }
        
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        const errorMsg = errorData.detail || errorData.message || `HTTP ${response.status}`;
        console.error('🚨 API Error Details:', errorData);
        
        // Log detailed error information
        if (window.logError) {
          window.logError(errorMsg, `API Request: ${endpoint}`, {
            status: response.status,
            statusText: response.statusText,
            url,
            headers: defaultHeaders,
            responseData: errorData,
            requestBody: options.body
          });
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('✅ API Response Data:', data);
      return data;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown API error';
      console.error(`🚨 API Error (${endpoint}):`, error);
      
      // Log error with full context
      if (window.logError) {
        window.logError(errorMsg, `API Request: ${endpoint}`, {
          url,
          headers: defaultHeaders,
          requestBody: options.body,
          error: error instanceof Error ? error.stack : error
        });
      }
      
      throw error;
    }
  }

  // Events API
  async getEvents(): Promise<Event[]> {
    try {
      console.log('🎯 Starting getEvents() call...');
      const response = await this.request<Event[]>('/api/events');
      console.log('✅ getEvents() - Raw response:', response);
      
      // Handle both direct array response and wrapped response
      const events = Array.isArray(response) ? response : response.data || [];
      console.log('✅ getEvents() - Parsed events:', events);
      
      if (!Array.isArray(events)) {
        const errorMsg = 'Events response is not an array';
        console.error('🚨 Events data error:', errorMsg, events);
        if (window.logError) {
          window.logError(errorMsg, 'getEvents() - Data parsing', {
            responseType: typeof response,
            response,
            events
          });
        }
        throw new Error(errorMsg);
      }
      
      // Convert English categories to Spanish for display
      const processedEvents = events.map(event => ({
        ...event,
        category: categoryToSpanish(event.category)
      }));
      
      console.log('✅ getEvents() - Final processed events:', processedEvents);
      return processedEvents;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error fetching events';
      console.error('🚨 Failed to fetch events:', error);
      
      if (window.logError) {
        window.logError(errorMsg, 'getEvents() - Main method', {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString()
        });
      }
      
      throw error;
    }
  }

  async getEvent(id: string): Promise<Event> {
    const response = await this.request<Event>(`/api/events/${id}`);
    const event = response.data || response;
    // Convert category back to Spanish for frontend
    return {
      ...event,
      category: categoryToSpanish(event.category)
    };
  }

  async createEvent(eventData: EventCreate): Promise<Event> {
    // Convert Spanish category to English for API
    const apiEventData = {
      ...eventData,
      category: categoryToEnglish(eventData.category),
      contact_info: typeof eventData.contact_info === 'object' 
        ? `${eventData.contact_info.email} | ${eventData.contact_info.phone}`
        : eventData.contact_info
    };

    const response = await this.request<Event>('/api/events', {
      method: 'POST',
      body: JSON.stringify(apiEventData)
    });
    
    const event = response.data || response;
    // Convert category back to Spanish for frontend
    return {
      ...event,
      category: categoryToSpanish(event.category)
    };
  }

  async updateEvent(id: string, eventData: Partial<EventCreate>): Promise<Event> {
    // Convert Spanish category to English for API
    const apiEventData = {
      ...eventData,
      category: eventData.category ? categoryToEnglish(eventData.category) : undefined,
      contact_info: eventData.contact_info && typeof eventData.contact_info === 'object' 
        ? `${eventData.contact_info.email} | ${eventData.contact_info.phone}`
        : eventData.contact_info
    };

    const response = await this.request<Event>(`/api/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(apiEventData)
    });
    
    const event = response.data || response;
    // Convert category back to Spanish for frontend
    return {
      ...event,
      category: categoryToSpanish(event.category)
    };
  }

  async deleteEvent(id: string): Promise<void> {
    await this.request(`/api/events/${id}`, {
      method: 'DELETE'
    });
  }

  // Auth API
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const response = await this.request<{ access_token: string; user: any }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    // Backend returns token directly, not wrapped in data
    const result = response.data || response;
    
    if (result.access_token) {
      localStorage.setItem('auth_token', result.access_token);
      console.log('Token saved:', result.access_token.substring(0, 20) + '...');
    } else {
      console.error('No access_token in response:', result);
    }
    
    return result;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    // Note: No logout endpoint in current backend, just remove token
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/api/me');
    return response.data || response;
  }

  async updateProfile(profileData: UserProfileUpdate): Promise<User> {
    const response = await this.request<User>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.data || response;
  }

  async getUserReservations(): Promise<{ reservations: Reservation[], total: number }> {
    const response = await this.request<{ reservations: Reservation[], total: number }>('/api/profile/reservations');
    return response.data || response;
  }

  async getUserStats(): Promise<UserStats> {
    const response = await this.request<UserStats>('/api/profile/stats');
    return response.data || response;
  }

  // Dashboard API
  async getDashboardStats(): Promise<any> {
    const response = await this.request('/api/admin/stats');
    return response.data || response;
  }

  // Categories API
  async getEventCategories(): Promise<string[]> {
    const response = await this.request<string[]>('/api/categories');
    return Array.isArray(response) ? response : response.data || [];
  }

  // Users API
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    status_filter?: string;
    location_filter?: string;
    age_min?: number;
    age_max?: number;
    sort_by?: string;
    sort_order?: string;
  }): Promise<UsersResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status_filter) queryParams.append('status_filter', params.status_filter);
      if (params.location_filter) queryParams.append('location_filter', params.location_filter);
      if (params.age_min !== undefined) queryParams.append('age_min', params.age_min.toString());
      if (params.age_max !== undefined) queryParams.append('age_max', params.age_max.toString());
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);
    }

    const url = `/api/admin/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await this.request<UsersResponse>(url);
    return response.data || response;
  }

  async getUser(id: string): Promise<User> {
    const response = await this.request<User>(`/api/admin/users/${id}`);
    return response.data || response;
  }

  async createUser(userData: UserCreate): Promise<User> {
    const response = await this.request<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response.data || response;
  }

  async updateUser(id: string, userData: UserUpdate): Promise<User> {
    const response = await this.request<User>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
    return response.data || response;
  }

  async deleteUser(id: string): Promise<void> {
    await this.request(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  async bulkUserAction(action: string, userIds: string[]): Promise<any> {
    const response = await this.request('/api/admin/users/bulk-action', {
      method: 'POST',
      body: JSON.stringify({
        action,
        user_ids: userIds
      })
    });
    return response.data || response;
  }

  // Dashboard Analytics Methods - Duplicate method removed (using /api/admin/stats above)
  
  // Note: These methods are commented out because the endpoints don't exist in the current backend
  // Uncomment and implement backend endpoints if needed
  
  // async getQuickStats(): Promise<any> {
  //   const response = await this.request('/api/dashboard/quick-stats');
  //   return response.data;
  // }

  // async getSystemStatus(): Promise<any> {
  //   const response = await this.request('/api/dashboard/system-status');
  //   return response.data;
  // }

  // async getActivityFeed(limit: number = 20): Promise<any> {
  //   const response = await this.request(`/api/dashboard/activity-feed?limit=${limit}`);
  //   return response.data;
  // }

  // async getMonthlyAttendanceChart(): Promise<any> {
  //   const response = await this.request('/api/dashboard/charts/monthly-attendance');
  //   return response.data;
  // }

  // async getCategoriesDistributionChart(): Promise<any> {
  //   const response = await this.request('/api/dashboard/charts/categories-distribution');
  //   return response.data;
  // }

  // async getWeeklyTrendsChart(): Promise<any> {
  //   const response = await this.request('/api/dashboard/charts/weekly-trends');
  //   return response.data;
  // }

  // async getOccupancyRatesChart(): Promise<any> {
  //   const response = await this.request('/api/dashboard/charts/occupancy-rates');
  //   return response.data;
  // }

  // Check-in Methods - Using actual server.py endpoints
  async checkInUser(method: string, value: string, eventId?: string): Promise<any> {
    // The server.py endpoint expects an "identifier" field
    let identifier = value;
    
    // Format identifier based on method for server.py compatibility
    if (method === 'qr_code') {
      identifier = `reservation:${value}`;
    } else if (method === 'reservation_code') {
      identifier = value.toUpperCase();
    }
    
    const response = await this.request('/api/checkin', {
      method: 'POST',
      body: JSON.stringify({
        identifier: identifier
      })
    });
    
    // Transform response to match frontend expectations
    return {
      success: true,
      message: response.message,
      reservation_id: response.reservation_id,
      user_name: response.user_name,
      user_email: response.user_email || 'No disponible',
      event_title: response.event_title,
      timestamp: new Date().toISOString()
    };
  }

  async searchForCheckIn(method: string, value: string, eventId?: string): Promise<any> {
    // For search, we'll simulate the check-in to get reservation details without actually checking in
    // This is a read-only operation to preview the reservation
    try {
      // Format identifier the same way as check-in
      let identifier = value;
      if (method === 'qr_code') {
        identifier = `reservation:${value}`;
      } else if (method === 'reservation_code') {
        identifier = value.toUpperCase();
      }
      
      // We'll use a mock response for now since server.py doesn't have a search endpoint
      // In a real implementation, this would be a separate endpoint
      return {
        success: true,
        data: {
          reservations: [{
            id: 'mock-reservation-id',
            user_name: 'Usuario de Prueba',
            user_email: 'test@example.com',
            event_title: 'Evento de Prueba',
            event_date: new Date().toISOString(),
            checkin_code: value,
            status: 'confirmed'
          }]
        }
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Reserva no encontrada'
      };
    }
  }

  async getCheckInStats(): Promise<any> {
    // Use actual server.py admin stats endpoint
    const response = await this.request('/api/admin/stats');
    return {
      checkins_today: response.total_checkins || 0,
      checkin_rate: response.total_checkins && response.total_reservations ? 
        (response.total_checkins / response.total_reservations * 100) : 0,
      recent_checkins: []
    };
  }

  async getCheckInHistory(skip: number = 0, limit: number = 20, eventId?: string): Promise<any> {
    // For now, return empty as server.py doesn't have this endpoint
    return {
      items: [],
      total: 0,
      page: 1,
      page_size: limit
    };
  }

  // Reservations Methods
  async getReservations(skip: number = 0, limit: number = 20, statusFilter?: string): Promise<any> {
    let url = `/api/reservations?skip=${skip}&limit=${limit}`;
    if (statusFilter) {
      url += `&status_filter=${statusFilter}`;
    }
    const response = await this.request(url);
    return response;
  }

  async getReservation(reservationId: string): Promise<any> {
    const response = await this.request(`/api/reservations/${reservationId}`);
    return response;
  }

  async createReservation(eventId: string, notes?: string): Promise<any> {
    const response = await this.request('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        event_id: eventId,
        notes
      })
    });
    return response;
  }

  async cancelReservation(reservationId: string): Promise<any> {
    const response = await this.request(`/api/reservations/${reservationId}/cancel`, {
      method: 'PUT'
    });
    return response;
  }

  async getReservationStats(): Promise<any> {
    // Use the actual server.py reservations metrics endpoint
    const response = await this.request('/api/admin/reservations/metrics');
    // Transform response to match frontend expectations
    return {
      data: {
        total_reservations: response.total_reservations || 0,
        confirmed_reservations: response.confirmed || 0,
        checked_in_reservations: response.checked_in || 0,
        cancelled_reservations: response.cancelled || 0
      }
    };
  }
}

export const apiService = new ApiService();
export type { 
  Event, 
  EventCreate, 
  User, 
  UserCreate, 
  UserUpdate, 
  UserProfileUpdate,
  UsersResponse, 
  ApiResponse, 
  Reservation,
  UserStats 
};
