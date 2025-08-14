import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Center, CenterContext, UserRole } from '@/types';

interface CenterState extends CenterContext {
  userRole: UserRole | null;
  
  // Actions
  setCurrentCenter: (center: string) => void;
  setAvailableCenters: (centers: Center[]) => void;
  setUserRole: (role: UserRole) => void;
  initializeCenterContext: (user: { center: string; role: UserRole }, allCenters: Center[]) => void;
  canSwitchCenter: boolean;
  
  // Helper methods
  getCurrentCenterInfo: () => Center | null;
  hasPermission: (resource: string, action: string) => boolean;
  isSuperAdmin: () => boolean;
}

// Default centers (will be fetched from API in production)
const DEFAULT_CENTERS: Center[] = [
  {
    id: 'santo-domingo',
    name: 'Santo Domingo',
    city: 'Santo Domingo',
    address: 'Av. Winston Churchill, Plaza de la Cultura',
    phone: '(809) 685-2000',
    email: 'info.sd@banreservas.com',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'santiago',
    name: 'Santiago',
    city: 'Santiago',
    address: 'Calle del Sol #50, Santiago',
    phone: '(809) 582-5000',
    email: 'info.santiago@banreservas.com',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useCenterStore = create<CenterState>()(
  persist(
    (set, get) => ({
      currentCenter: 'santo-domingo',
      availableCenters: DEFAULT_CENTERS,
      canSwitchCenter: false,
      userRole: null,

      setCurrentCenter: (center: string) => {
        const state = get();
        // Solo super_admin puede cambiar de centro
        if (state.isSuperAdmin()) {
          set({ currentCenter: center });
        }
      },

      setAvailableCenters: (centers: Center[]) => {
        set({ availableCenters: centers });
      },

      setUserRole: (role: UserRole) => {
        set({ 
          userRole: role,
          canSwitchCenter: role === 'super_admin'
        });
      },

      initializeCenterContext: (user: { center: string; role: UserRole }, allCenters: Center[]) => {
        const canSwitch = user.role === 'super_admin';
        
        set({
          currentCenter: user.center,
          availableCenters: allCenters.length > 0 ? allCenters : DEFAULT_CENTERS,
          userRole: user.role,
          canSwitchCenter: canSwitch
        });
      },

      getCurrentCenterInfo: () => {
        const state = get();
        return state.availableCenters.find(c => c.id === state.currentCenter) || null;
      },

      hasPermission: (resource: string, action: string) => {
        const state = get();
        const role = state.userRole;
        
        if (!role) return false;
        
        // Super admin tiene todos los permisos
        if (role === 'super_admin') return true;
        
        // Admin local tiene todos los permisos en su sede
        if (role === 'admin_local') return true;
        
        // Editor local puede crear y editar, pero no borrar
        if (role === 'editor_local') {
          return ['read', 'create', 'update'].includes(action);
        }
        
        // Viewer solo puede leer
        if (role === 'viewer') {
          return action === 'read';
        }
        
        return false;
      },

      isSuperAdmin: () => {
        return get().userRole === 'super_admin';
      }
    }),
    {
      name: 'center-store',
      partialize: (state) => ({
        currentCenter: state.currentCenter,
        availableCenters: state.availableCenters,
        userRole: state.userRole,
        canSwitchCenter: state.canSwitchCenter
      })
    }
  )
);

// Helper functions para usar en componentes
export const useCurrentCenter = () => {
  const { currentCenter, getCurrentCenterInfo } = useCenterStore();
  return {
    currentCenter,
    centerInfo: getCurrentCenterInfo()
  };
};

export const usePermissions = () => {
  const { hasPermission, isSuperAdmin, userRole } = useCenterStore();
  return {
    hasPermission,
    isSuperAdmin: isSuperAdmin(),
    userRole,
    canCreate: (resource: string) => hasPermission(resource, 'create'),
    canRead: (resource: string) => hasPermission(resource, 'read'),
    canUpdate: (resource: string) => hasPermission(resource, 'update'),
    canDelete: (resource: string) => hasPermission(resource, 'delete')
  };
};

export const useCenterSelector = () => {
  const { currentCenter, availableCenters, canSwitchCenter, setCurrentCenter } = useCenterStore();
  
  return {
    currentCenter,
    availableCenters,
    canSwitchCenter,
    switchCenter: setCurrentCenter
  };
};