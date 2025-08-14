import { create } from "zustand";
import { Event, EventCategory, EventStatus, PaginatedResponse } from "@/types";
import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  pagination: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
  };
  filters: {
    category?: EventCategory;
    status?: EventStatus;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
}

interface EventsActions {
  fetchEvents: (params?: any) => Promise<void>;
  fetchEventById: (id: string) => Promise<Event>;
  createEvent: (eventData: Partial<Event>) => Promise<Event>;
  updateEvent: (id: string, eventData: Partial<Event>) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
  setFilters: (filters: Partial<EventsState["filters"]>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<EventsState["pagination"]>) => void;
}

export const useEventsStore = create<EventsState & EventsActions>((set, get) => ({
  // Initial state
  events: [],
  currentEvent: null,
  isLoading: false,
  pagination: {
    page: 1,
    per_page: 12,
    total: 0,
    pages: 0,
  },
  filters: {},

  // Actions
  fetchEvents: async (params = {}) => {
    try {
      set({ isLoading: true });
      
      const { filters, pagination } = get();
      const queryParams = {
        page: pagination.page,
        per_page: pagination.per_page,
        ...filters,
        ...params,
      };

      const response: PaginatedResponse<Event> = await apiClient.get(
        API_ENDPOINTS.EVENTS.LIST,
        { params: queryParams }
      );

      set({
        events: response.items || [],
        pagination: {
          page: response.page || 1,
          per_page: response.per_page || 12,
          total: response.total || 0,
          pages: response.pages || 0,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching events:", error);
      set({ 
        events: [], // Asegurar que events sea siempre un array
        isLoading: false 
      });
      throw error;
    }
  },

  fetchEventById: async (id: string) => {
    try {
      set({ isLoading: true });
      
      const event: Event = await apiClient.get(API_ENDPOINTS.EVENTS.GET(id));
      
      set({ currentEvent: event, isLoading: false });
      return event;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createEvent: async (eventData: Partial<Event>) => {
    try {
      set({ isLoading: true });
      
      const newEvent: Event = await apiClient.post(
        API_ENDPOINTS.EVENTS.CREATE,
        eventData
      );
      
      // Add to events list
      const { events } = get();
      set({
        events: [newEvent, ...events],
        isLoading: false,
      });
      
      return newEvent;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateEvent: async (id: string, eventData: Partial<Event>) => {
    try {
      set({ isLoading: true });
      
      const updatedEvent: Event = await apiClient.put(
        API_ENDPOINTS.EVENTS.UPDATE(id),
        eventData
      );
      
      // Update in events list
      const { events } = get();
      const updatedEvents = events.map((event) =>
        event.id === id ? updatedEvent : event
      );
      
      set({
        events: updatedEvents,
        currentEvent: updatedEvent,
        isLoading: false,
      });
      
      return updatedEvent;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  deleteEvent: async (id: string) => {
    try {
      set({ isLoading: true });
      
      await apiClient.delete(API_ENDPOINTS.EVENTS.DELETE(id));
      
      // Remove from events list
      const { events } = get();
      const filteredEvents = events.filter((event) => event.id !== id);
      
      set({
        events: filteredEvents,
        currentEvent: null,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  setCurrentEvent: (event: Event | null) => {
    set({ currentEvent: event });
  },

  setFilters: (newFilters: Partial<EventsState["filters"]>) => {
    const { filters } = get();
    set({ filters: { ...filters, ...newFilters } });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setPagination: (newPagination: Partial<EventsState["pagination"]>) => {
    const { pagination } = get();
    set({ pagination: { ...pagination, ...newPagination } });
  },
}));
