import { create } from "zustand";
import { Reservation, CheckInData, Event } from "@/types";
import { apiClient } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";

interface ReservationsState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  checkInHistory: any[];
}

interface ReservationsActions {
  fetchReservations: () => Promise<void>;
  createReservation: (eventId: string, asistentes: number) => Promise<Reservation>;
  cancelReservation: (reservationId: string) => Promise<void>;
  checkIn: (data: CheckInData) => Promise<any>;
  getReservationByCode: (code: string) => Promise<Reservation>;
  setCurrentReservation: (reservation: Reservation | null) => void;
}

export const useReservationsStore = create<ReservationsState & ReservationsActions>(
  (set, get) => ({
    // Initial state
    reservations: [],
    currentReservation: null,
    isLoading: false,
    checkInHistory: [],

    // Actions
    fetchReservations: async () => {
      try {
        set({ isLoading: true });
        
        const reservations: Reservation[] = await apiClient.get(
          API_ENDPOINTS.RESERVATIONS.LIST
        );
        
        set({ reservations, isLoading: false });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    createReservation: async (eventId: string, asistentes: number) => {
      try {
        set({ isLoading: true });
        
        const reservationData = {
          event_id: eventId,
          numero_asistentes: asistentes,
        };
        
        const newReservation: Reservation = await apiClient.post(
          API_ENDPOINTS.RESERVATIONS.CREATE,
          reservationData
        );
        
        // Add to reservations list
        const { reservations } = get();
        set({
          reservations: [newReservation, ...reservations],
          currentReservation: newReservation,
          isLoading: false,
        });
        
        return newReservation;
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    cancelReservation: async (reservationId: string) => {
      try {
        set({ isLoading: true });
        
        await apiClient.delete(API_ENDPOINTS.RESERVATIONS.CANCEL(reservationId));
        
        // Update reservation status in list
        const { reservations } = get();
        const updatedReservations = reservations.map((reservation) =>
          reservation.id === reservationId
            ? { ...reservation, estado: "cancelada" as const }
            : reservation
        );
        
        set({
          reservations: updatedReservations,
          isLoading: false,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    checkIn: async (data: CheckInData) => {
      try {
        set({ isLoading: true });
        
        const result = await apiClient.post(API_ENDPOINTS.RESERVATIONS.CHECKIN, data);
        
        // Update check-in history
        const { checkInHistory } = get();
        set({
          checkInHistory: [result, ...checkInHistory],
          isLoading: false,
        });
        
        return result;
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    getReservationByCode: async (code: string) => {
      try {
        set({ isLoading: true });
        
        const reservation: Reservation = await apiClient.get(
          `${API_ENDPOINTS.RESERVATIONS.LIST}/${code}`
        );
        
        set({ currentReservation: reservation, isLoading: false });
        return reservation;
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    setCurrentReservation: (reservation: Reservation | null) => {
      set({ currentReservation: reservation });
    },
  })
);
