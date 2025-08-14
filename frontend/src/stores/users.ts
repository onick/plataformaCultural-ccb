/**
 * Users Store - Zustand store for user management state
 * Handles user list, filters, pagination, and CRUD operations
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { usersService, User, UserCreate, UserUpdate, PaginatedResponse, UserStats, BulkUserAction } from '@/services/users';

interface UsersFilter {
  search: string;
  location: string;
  is_admin?: boolean;
  page: number;
  pageSize: number;
}

interface UsersState {
  // Data
  users: User[];
  selectedUsers: string[];
  currentUser: User | null;
  stats: UserStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Filters
  filters: UsersFilter;
  
  // Actions
  setUsers: (users: User[]) => void;
  setCurrentUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<UsersFilter>) => void;
  setSelectedUsers: (userIds: string[]) => void;
  toggleUserSelection: (userId: string) => void;
  selectAllUsers: () => void;
  clearSelection: () => void;
  
  // API Actions
  fetchUsers: () => Promise<void>;
  fetchUser: (userId: string) => Promise<void>;
  createUser: (userData: UserCreate) => Promise<void>;
  updateUser: (userId: string, updateData: UserUpdate) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  bulkAction: (action: BulkUserAction['action']) => Promise<void>;
  fetchStats: () => Promise<void>;
  importUsers: (file: File) => Promise<any>;
  
  // Utility actions
  refreshUsers: () => Promise<void>;
  resetFilters: () => void;
  goToPage: (page: number) => Promise<void>;
  changePageSize: (pageSize: number) => Promise<void>;
}

const initialFilters: UsersFilter = {
  search: '',
  location: '',
  is_admin: undefined,
  page: 1,
  pageSize: 20,
};

const initialPagination = {
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

export const useUsersStore = create<UsersState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        users: [],
        selectedUsers: [],
        currentUser: null,
        stats: null,
        loading: false,
        error: null,
        pagination: initialPagination,
        filters: initialFilters,

        // Setters
        setUsers: (users) => set({ users }),
        setCurrentUser: (user) => set({ currentUser: user }),
        setLoading: (loading) => set({ loading }),
        setError: (error) => set({ error }),
        setFilters: (newFilters) => 
          set((state) => ({ 
            filters: { ...state.filters, ...newFilters, page: 1 } // Reset to page 1 on filter change
          })),
        setSelectedUsers: (userIds) => set({ selectedUsers: userIds }),
        
        toggleUserSelection: (userId) =>
          set((state) => ({
            selectedUsers: state.selectedUsers.includes(userId)
              ? state.selectedUsers.filter(id => id !== userId)
              : [...state.selectedUsers, userId]
          })),
        
        selectAllUsers: () =>
          set((state) => ({
            selectedUsers: state.users.map(user => user.id)
          })),
        
        clearSelection: () => set({ selectedUsers: [] }),

        // API Actions
        fetchUsers: async () => {
          const { filters, setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const params = {
              skip: (filters.page - 1) * filters.pageSize,
              limit: filters.pageSize,
              search: filters.search || undefined,
              location: filters.location || undefined,
              is_admin: filters.is_admin,
            };
            
            const response: PaginatedResponse<User> = await usersService.getUsers(params);
            
            set({
              users: response.items,
              pagination: {
                total: response.total,
                page: response.page,
                pageSize: response.page_size,
                totalPages: response.total_pages,
                hasNext: response.has_next,
                hasPrevious: response.has_previous,
              },
            });
            
          } catch (error: any) {
            console.error('Failed to fetch users:', error);
            setError(error.message || 'Error al cargar usuarios');
          } finally {
            setLoading(false);
          }
        },

        fetchUser: async (userId: string) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const user = await usersService.getUser(userId);
            set({ currentUser: user });
            
          } catch (error: any) {
            console.error('Failed to fetch user:', error);
            setError(error.message || 'Error al cargar usuario');
          } finally {
            setLoading(false);
          }
        },

        createUser: async (userData: UserCreate) => {
          const { setLoading, setError, fetchUsers } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await usersService.createUser(userData);
            
            // Refresh the user list
            await fetchUsers();
            
          } catch (error: any) {
            console.error('Failed to create user:', error);
            setError(error.message || 'Error al crear usuario');
            throw error; // Re-throw for component handling
          } finally {
            setLoading(false);
          }
        },

        updateUser: async (userId: string, updateData: UserUpdate) => {
          const { setLoading, setError, fetchUsers } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const updatedUser = await usersService.updateUser(userId, updateData);
            
            // Update user in current list
            set((state) => ({
              users: state.users.map(user => 
                user.id === userId ? updatedUser : user
              ),
              currentUser: state.currentUser?.id === userId ? updatedUser : state.currentUser
            }));
            
          } catch (error: any) {
            console.error('Failed to update user:', error);
            setError(error.message || 'Error al actualizar usuario');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        deleteUser: async (userId: string) => {
          const { setLoading, setError, fetchUsers } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await usersService.deleteUser(userId);
            
            // Refresh the user list
            await fetchUsers();
            
          } catch (error: any) {
            console.error('Failed to delete user:', error);
            setError(error.message || 'Error al eliminar usuario');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        bulkAction: async (action: BulkUserAction['action']) => {
          const { selectedUsers, setLoading, setError, fetchUsers, clearSelection } = get();
          
          if (selectedUsers.length === 0) {
            setError('No hay usuarios seleccionados');
            return;
          }
          
          try {
            setLoading(true);
            setError(null);
            
            await usersService.bulkUserAction({
              user_ids: selectedUsers,
              action
            });
            
            // Clear selection and refresh
            clearSelection();
            await fetchUsers();
            
          } catch (error: any) {
            console.error('Failed to perform bulk action:', error);
            setError(error.message || 'Error en acción masiva');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        fetchStats: async () => {
          try {
            const stats = await usersService.getUserStats();
            set({ stats });
          } catch (error: any) {
            console.error('Failed to fetch user stats:', error);
            // Don't set error state for stats as it's not critical
          }
        },

        importUsers: async (file: File) => {
          const { setLoading, setError, fetchUsers } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const result = await usersService.importUsers(file);
            
            // Refresh users after import
            await fetchUsers();
            
            return result;
            
          } catch (error: any) {
            console.error('Failed to import users:', error);
            setError(error.message || 'Error al importar usuarios');
            throw error;
          } finally {
            setLoading(false);
          }
        },

        // Utility actions
        refreshUsers: async () => {
          const { fetchUsers } = get();
          await fetchUsers();
        },

        resetFilters: () => {
          set({ filters: initialFilters });
        },

        goToPage: async (page: number) => {
          const { filters, fetchUsers } = get();
          set({ filters: { ...filters, page } });
          await fetchUsers();
        },

        changePageSize: async (pageSize: number) => {
          const { filters, fetchUsers } = get();
          set({ filters: { ...filters, pageSize, page: 1 } });
          await fetchUsers();
        },
      }),
      {
        name: 'users-store',
        partialize: (state) => ({
          // Only persist filters, not the actual data
          filters: state.filters,
        }),
      }
    ),
    {
      name: 'UsersStore',
    }
  )
);

// Selector hooks for better performance
export const useUsersData = () => useUsersStore((state) => ({
  users: state.users,
  pagination: state.pagination,
  loading: state.loading,
  error: state.error,
}));

export const useUsersFilters = () => useUsersStore((state) => ({
  filters: state.filters,
  setFilters: state.setFilters,
  resetFilters: state.resetFilters,
}));

export const useUsersSelection = () => useUsersStore((state) => ({
  selectedUsers: state.selectedUsers,
  setSelectedUsers: state.setSelectedUsers,
  toggleUserSelection: state.toggleUserSelection,
  selectAllUsers: state.selectAllUsers,
  clearSelection: state.clearSelection,
}));

export const useUsersActions = () => useUsersStore((state) => ({
  fetchUsers: state.fetchUsers,
  createUser: state.createUser,
  updateUser: state.updateUser,
  deleteUser: state.deleteUser,
  bulkAction: state.bulkAction,
  refreshUsers: state.refreshUsers,
  goToPage: state.goToPage,
  changePageSize: state.changePageSize,
}));