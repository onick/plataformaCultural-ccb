'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Edit, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  TrendingUp,
  BarChart3,
  Settings,
  Camera,
  Save,
  X,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiService, User as UserType, UserProfileUpdate, Reservation, UserStats } from '@/services/api'
import { MainNav } from '@/components/layout/main-nav'

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    age: 0,
    location: '',
    bio: '',
    avatar_url: ''
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🎯 ProfilePage: Loading profile data...')
      
      // Load user profile
      const userProfile = await apiService.getProfile()
      console.log('✅ ProfilePage: User profile loaded:', userProfile)
      setUser(userProfile)
      
      // Load user reservations
      const reservationsData = await apiService.getUserReservations()
      console.log('✅ ProfilePage: Reservations loaded:', reservationsData)
      setReservations(reservationsData.reservations)
      
      // Load user stats
      const userStats = await apiService.getUserStats()
      console.log('✅ ProfilePage: Stats loaded:', userStats)
      setStats(userStats)
      
      // Set edit form data
      setEditForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        age: userProfile.age || 0,
        location: userProfile.location || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || ''
      })
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error loading profile data'
      console.error('🚨 ProfilePage: Error loading profile:', error)
      setError(errorMsg)
      
      // If unauthorized, redirect to login
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401')) {
        router.push('/auth/login')
        return
      }
      
      // Log error
      if (window.logError) {
        window.logError(errorMsg, 'ProfilePage - loadProfileData()', {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString()
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)
      
      console.log('💾 ProfilePage: Saving profile changes:', editForm)
      
      const updateData: UserProfileUpdate = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        age: editForm.age,
        location: editForm.location.trim(),
        bio: editForm.bio.trim(),
        avatar_url: editForm.avatar_url.trim()
      }
      
      const updatedUser = await apiService.updateProfile(updateData)
      console.log('✅ ProfilePage: Profile updated:', updatedUser)
      
      setUser(updatedUser)
      setIsEditing(false)
      setSuccess('¡Perfil actualizado exitosamente!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error updating profile'
      console.error('�� ProfilePage: Error updating profile:', error)
      setError(errorMsg)
      
      // Log error
      if (window.logError) {
        window.logError(errorMsg, 'ProfilePage - handleEditSave()', {
          error: error instanceof Error ? error.stack : error,
          formData: editForm,
          timestamp: new Date().toISOString()
        })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCancel = () => {
    if (!user) return
    
    // Reset form to original values
    setEditForm({
      name: user.name || '',
      phone: user.phone || '',
      age: user.age || 0,
      location: user.location || '',
      bio: user.bio || '',
      avatar_url: user.avatar_url || ''
    })
    
    setIsEditing(false)
    setError(null)
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'checked_in':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'confirmed':
        return 'Confirmada'
      case 'checked_in':
        return 'Asistió'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconocido'
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ccb-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error al cargar el perfil</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={loadProfileData}
              className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <p className="text-green-700 dark:text-green-300 text-sm">{success}</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Gestiona tu información personal y revisa tu historial de eventos
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-1"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                  {/* Avatar and basic info */}
                  <div className="text-center mb-6">
                    <div className="relative mx-auto w-24 h-24 mb-4">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-sm"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-ccb-blue to-ccb-lightblue flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-sm">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 p-1 bg-ccb-blue text-white rounded-full hover:bg-ccb-blue/90 transition-colors">
                          <Camera size={16} />
                        </button>
                      )}
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
                    <p className="text-gray-600 dark:text-gray-300">{user.email}</p>
                    
                    <div className="mt-4">
                      {!isEditing ? (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
                        >
                          <Edit size={16} className="mr-2" />
                          Editar Perfil
                        </button>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleEditSave}
                            disabled={isSaving}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSaving ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save size={16} />
                            )}
                            <span className="ml-2">{isSaving ? 'Guardando...' : 'Guardar'}</span>
                          </button>
                          <button
                            onClick={handleEditCancel}
                            disabled={isSaving}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre completo
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Teléfono
                          </label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Edad
                          </label>
                          <input
                            type="number"
                            value={editForm.age}
                            onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ubicación
                          </label>
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Biografía
                          </label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                            placeholder="Cuéntanos sobre ti..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            URL de Avatar
                          </label>
                          <input
                            type="url"
                            value={editForm.avatar_url}
                            onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{user.phone}</span>
                          </div>
                        )}
                        
                        {user.location && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{user.location}</span>
                          </div>
                        )}
                        
                        {user.age && (
                          <div className="flex items-center space-x-3">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">{user.age} años</span>
                          </div>
                        )}
                        
                        {user.bio && (
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{user.bio}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Stats and Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Stats Cards */}
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total_reservations}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Reservas Totales</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attended_events}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Eventos Asistidos</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.attendance_rate)}%</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Tasa Asistencia</p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 text-center">
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                                             <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcoming_reservations || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">Próximos Eventos</p>
                    </div>
                  </div>
                )}

                {/* Recent Reservations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Reservas Recientes</h3>
                  </div>
                  
                  <div className="p-6">
                    {reservations.length > 0 ? (
                      <div className="space-y-4">
                        {reservations.slice(0, 5).map((reservation) => (
                          <div key={reservation.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {reservation.event?.title || 'Evento eliminado'}
                              </h4>
                              <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                                <span className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {reservation.event?.date} - {reservation.event?.time}
                                </span>
                                <span className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {reservation.event?.location}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Código: {reservation.codigo_reserva}
                              </p>
                            </div>
                            
                            <div className="ml-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reservation.estado)}`}>
                                {getStatusText(reservation.estado)}
                              </span>
                            </div>
                          </div>
                        ))}
                        
                        {reservations.length > 5 && (
                          <div className="text-center pt-4">
                            <Link
                              href="/reservations"
                              className="text-ccb-blue hover:text-ccb-blue/80 text-sm font-medium"
                            >
                              Ver todas las reservas ({reservations.length})
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay reservas</h4>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                          Aún no has realizado ninguna reserva. ¡Explora nuestros eventos!
                        </p>
                        <Link
                          href="/events"
                          className="inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Explorar Eventos
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}