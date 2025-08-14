import { create } from 'zustand';
import { Reservation, Event, User } from '@/types';

interface ReservationStore {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  
  // Actions
  createReservation: (eventId: string, userInfo: Partial<User>) => Promise<Reservation>;
  getReservationByCode: (code: string) => Promise<Reservation | null>;
  checkInReservation: (reservationId: string) => Promise<void>;
  cancelReservation: (reservationId: string) => Promise<void>;
  getUserReservations: (userId: string) => Promise<Reservation[]>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReservationStore = create<ReservationStore>((set, get) => ({
  reservations: [],
  loading: false,
  error: null,

  createReservation: async (eventId: string, userInfo: Partial<User>) => {
    try {
      set({ loading: true, error: null });

      // Generar código único de 8 caracteres alfanuméricos
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const codigoReserva = generateCode();
      
      // Generar QR code (en producción esto se haría en el backend)
      const qrData = JSON.stringify({
        reservationId: `res_${Date.now()}`,
        eventId,
        code: codigoReserva,
        timestamp: new Date().toISOString()
      });

      const newReservation: Reservation = {
        id: `res_${Date.now()}`,
        user_id: userInfo.id || `user_${Date.now()}`,
        event_id: eventId,
        codigo_reserva: codigoReserva,
        codigo_qr: qrData,
        numero_asistentes: 1,
        estado: 'confirmada',
        center: 'santo-domingo', // Default center
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: userInfo as User
      };

      // En un escenario real, aquí harías la llamada al backend
      // const response = await fetch('/api/reservations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newReservation)
      // });

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000));

      set(state => ({
        reservations: [...state.reservations, newReservation],
        loading: false
      }));

      return newReservation;
    } catch (error) {
      set({ error: 'Error al crear la reserva', loading: false });
      throw error;
    }
  },

  getReservationByCode: async (code: string) => {
    try {
      set({ loading: true, error: null });

      // En un escenario real, aquí harías la llamada al backend
      // const response = await fetch(`/api/reservations/code/${code}`);
      // const reservation = await response.json();

      // Simular búsqueda en el estado local
      const { reservations } = get();
      const reservation = reservations.find(r => 
        r.codigo_reserva === code || 
        r.codigo_qr.includes(code)
      );

      set({ loading: false });
      return reservation || null;
    } catch (error) {
      set({ error: 'Error al buscar la reserva', loading: false });
      return null;
    }
  },

  checkInReservation: async (reservationId: string) => {
    try {
      set({ loading: true, error: null });

      // En un escenario real, aquí harías la llamada al backend
      // await fetch(`/api/reservations/${reservationId}/checkin`, {
      //   method: 'POST'
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      set(state => ({
        reservations: state.reservations.map(r => 
          r.id === reservationId 
            ? { 
                ...r, 
                estado: 'asistio' as const,
                fecha_checkin: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : r
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Error al realizar check-in', loading: false });
      throw error;
    }
  },

  cancelReservation: async (reservationId: string) => {
    try {
      set({ loading: true, error: null });

      // En un escenario real, aquí harías la llamada al backend
      // await fetch(`/api/reservations/${reservationId}`, {
      //   method: 'DELETE'
      // });

      await new Promise(resolve => setTimeout(resolve, 500));

      set(state => ({
        reservations: state.reservations.map(r => 
          r.id === reservationId 
            ? { 
                ...r, 
                estado: 'cancelada' as const,
                updated_at: new Date().toISOString()
              }
            : r
        ),
        loading: false
      }));
    } catch (error) {
      set({ error: 'Error al cancelar la reserva', loading: false });
      throw error;
    }
  },

  getUserReservations: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      // En un escenario real, aquí harías la llamada al backend
      // const response = await fetch(`/api/users/${userId}/reservations`);
      // const userReservations = await response.json();

      const { reservations } = get();
      const userReservations = reservations.filter(r => r.user_id === userId);

      set({ loading: false });
      return userReservations;
    } catch (error) {
      set({ error: 'Error al obtener reservas del usuario', loading: false });
      return [];
    }
  },

  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error })
}));