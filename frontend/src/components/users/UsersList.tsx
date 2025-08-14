'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  Shield,
  MapPin,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  Square,
  Download,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { useUsersStore, useUsersData, useUsersFilters, useUsersSelection } from '@/stores/users';
import { User } from '@/services/users';

interface UsersListProps {
  className?: string;
}

export default function UsersList({ className = '' }: UsersListProps) {
  const { users, pagination, loading, error } = useUsersData();
  const { filters, setFilters, resetFilters } = useUsersFilters();
  const { selectedUsers, toggleUserSelection, selectAllUsers, clearSelection } = useUsersSelection();
  
  const { 
    fetchUsers, 
    deleteUser, 
    bulkAction, 
    goToPage, 
    changePageSize 
  } = useUsersStore();

  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle search with debounce
  const [searchTerm, setSearchTerm] = useState(filters.search);
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ search: searchTerm });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setFilters]);

  // Trigger fetch when filters change
  useEffect(() => {
    fetchUsers();
  }, [filters, fetchUsers]);

  const handleDelete = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    
    const actionText = {
      delete: 'eliminar',
      activate: 'activar',
      make_admin: 'hacer administrador',
      remove_admin: 'quitar administrador'
    }[action] || action;

    if (confirm(`¿Estás seguro de que quieres ${actionText} ${selectedUsers.length} usuario(s)?`)) {
      try {
        await bulkAction(action as any);
        setShowBulkActions(false);
      } catch (error) {
        console.error('Error in bulk action:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const allSelected = users.length > 0 && selectedUsers.length === users.length;
  const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </button>
          
          <Link
            href="/admin/users/create"
            className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Usuario</span>
          </Link>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nombre, email, ubicación..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ location: e.target.value })}
                placeholder="Filtrar por ubicación"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Usuario
              </label>
              <select
                value={filters.is_admin === undefined ? '' : filters.is_admin.toString()}
                onChange={(e) => setFilters({ 
                  is_admin: e.target.value === '' ? undefined : e.target.value === 'true'
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue"
              >
                <option value="">Todos</option>
                <option value="true">Administradores</option>
                <option value="false">Usuarios Regulares</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </motion.div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-ccb-blue/5 border border-ccb-blue/20 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-ccb-blue">
              {selectedUsers.length} usuario(s) seleccionado(s)
            </span>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('make_admin')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              >
                Hacer Admin
              </button>
              <button
                onClick={() => handleBulkAction('remove_admin')}
                className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Quitar Admin
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              onClick={allSelected ? clearSelection : selectAllUsers}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-ccb-blue" />
              ) : someSelected ? (
                <div className="w-5 h-5 bg-ccb-blue/20 border-2 border-ccb-blue rounded flex items-center justify-center">
                  <div className="w-2 h-2 bg-ccb-blue rounded-sm" />
                </div>
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <span className="font-medium text-gray-900 dark:text-white">
              {pagination.total} usuarios
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleUserSelection(user.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                  >
                    {selectedUsers.includes(user.id) ? (
                      <CheckSquare className="w-5 h-5 text-ccb-blue" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </h3>
                      {/* Show role badge */}
                      {(user as any).role && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (user as any).role === 'super_admin' ? 'bg-yellow-100 text-yellow-800' :
                          (user as any).role === 'admin_local' ? 'bg-purple-100 text-purple-800' :
                          (user as any).role === 'editor_local' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          <Shield className="w-3 h-3 mr-1" />
                          {(user as any).role === 'super_admin' ? 'Super Admin' :
                           (user as any).role === 'admin_local' ? 'Admin Local' :
                           (user as any).role === 'editor_local' ? 'Editor Local' :
                           'Viewer'}
                        </span>
                      )}
                      {/* Show center badge */}
                      {(user as any).center && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          📍 {(user as any).center === 'santo-domingo' ? 'Santo Domingo' : 'Santiago'}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Desde {formatDate(user.created_at)}</span>
                      </div>
                    </div>
                    
                    {(user.total_reservations || user.total_checkins) && (
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>{user.total_reservations || 0} reservas</span>
                        <span>{user.total_checkins || 0} check-ins</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="p-2 text-gray-400 hover:text-ccb-blue transition-colors"
                    title="Ver detalles"
                  >
                    <Users className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/admin/users/${user.id}/edit`}
                    className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="px-6 py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filters.search || filters.location ? 
                'Intenta ajustar los filtros de búsqueda' : 
                'Comienza creando tu primer usuario'
              }
            </p>
            {!filters.search && !filters.location && (
              <Link
                href="/admin/users/create"
                className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Usuario
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {((pagination.page - 1) * pagination.pageSize) + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} de {pagination.total}
            </span>
            
            <select
              value={pagination.pageSize}
              onChange={(e) => changePageSize(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ccb-blue"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={!pagination.hasPrevious}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
            
            <span className="px-4 py-2 text-sm font-medium">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ccb-blue"></div>
            <span>Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
}