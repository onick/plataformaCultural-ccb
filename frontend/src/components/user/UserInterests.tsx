'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Target,
  BarChart3,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

interface UserInterest {
  category: string
  score: number
  percentage: number
}

interface ActivitySummary {
  total_events: number
  total_reservations: number
  total_checkins: number
  categories_explored: string[]
  preferred_times: Record<string, number>
  preferred_locations: Record<string, number>
}

interface Recommendation {
  event_id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  recommendation_score: number
  reason: string
}

interface InterestsData {
  primary_interests: UserInterest[]
  interest_percentages: Record<string, number>
  activity_summary: ActivitySummary
  recommendations: Recommendation[]
  engagement_level: 'new' | 'low' | 'medium' | 'high'
  diversity_score: number
  analysis_date: string
}

interface UserInterestsProps {
  className?: string
}

export default function UserInterests({ className = '' }: UserInterestsProps) {
  const [interestsData, setInterestsData] = useState<InterestsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  const fetchInterests = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/interests/my-interests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch interests')
      }

      const data = await response.json()
      setInterestsData(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading interests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterests()
  }, [user])

  const getEngagementInfo = (level: string) => {
    const info = {
      new: {
        label: 'Nuevo Usuario',
        color: 'bg-gray-100 text-gray-600',
        description: 'Comienza a explorar eventos para personalizar recomendaciones'
      },
      low: {
        label: 'Explorador',
        color: 'bg-blue-100 text-blue-600',
        description: 'Has comenzado a participar en eventos'
      },
      medium: {
        label: 'Participante Activo',
        color: 'bg-green-100 text-green-600',
        description: 'Participas regularmente en eventos culturales'
      },
      high: {
        label: 'Entusiasta Cultural',
        color: 'bg-purple-100 text-purple-600',
        description: 'Eres muy activo en la comunidad cultural'
      }
    }
    return info[level as keyof typeof info] || info.new
  }

  const getCategoryIcon = (category: string) => {
    // This would ideally be in a shared utility
    const iconMap: Record<string, string> = {
      'Cinema Dominicano': '🎬',
      'Cine Clásico': '🎭',
      'Cine General': '📽️',
      'Talleres': '🛠️',
      'Conciertos': '🎵',
      'Charlas/Conferencias': '🎤',
      'Exposiciones de Arte': '🎨',
      'Experiencias 3D Inmersivas': '🥽'
    }
    return iconMap[category] || '📅'
  }

  if (loading) {
    return (
      <div className={`${className} p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} p-6`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600 mb-2">Error al cargar tus intereses</p>
          <button
            onClick={fetchInterests}
            className="text-sm text-red-500 hover:text-red-700 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }

  if (!interestsData) {
    return (
      <div className={`${className} p-6`}>
        <div className="text-center text-gray-500">
          <Info className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay datos de intereses disponibles</p>
        </div>
      </div>
    )
  }

  const engagementInfo = getEngagementInfo(interestsData.engagement_level)

  return (
    <div className={`${className} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Sparkles className="w-6 h-6 mr-2 text-ccb-blue" />
            Tus Intereses Culturales
          </h2>
          <p className="text-gray-600 mt-1">
            Basado en tu actividad y participación en eventos
          </p>
        </div>
        <button
          onClick={fetchInterests}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-ccb-blue transition-colors rounded-lg hover:bg-gray-100"
          title="Actualizar intereses"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Engagement Level */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Nivel de Participación</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${engagementInfo.color}`}>
            {engagementInfo.label}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4">{engagementInfo.description}</p>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-ccb-blue">
              {interestsData.activity_summary.total_events}
            </div>
            <div className="text-sm text-gray-500">Eventos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {interestsData.activity_summary.total_checkins}
            </div>
            <div className="text-sm text-gray-500">Asistencias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {interestsData.activity_summary.categories_explored.length}
            </div>
            <div className="text-sm text-gray-500">Categorías</div>
          </div>
        </div>
      </motion.div>

      {/* Primary Interests */}
      {interestsData.primary_interests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-ccb-blue" />
            Tus Intereses Principales
          </h3>
          
          <div className="space-y-4">
            {interestsData.primary_interests.map((interest, index) => (
              <div key={interest.category} className="flex items-center">
                <div className="text-2xl mr-3">
                  {getCategoryIcon(interest.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-900">{interest.category}</span>
                    <span className="text-sm text-gray-500">{interest.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${interest.percentage}%` }}
                      transition={{ delay: 0.2 + index * 0.1, duration: 0.8 }}
                      className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue h-2 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {interestsData.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-ccb-blue" />
            Recomendaciones para Ti
          </h3>
          
          <div className="space-y-4">
            {interestsData.recommendations.map((rec, index) => (
              <motion.div
                key={rec.event_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/events/${rec.event_id}`}
              >
                <div className="text-2xl mr-4">
                  {getCategoryIcon(rec.category)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {rec.date}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {rec.time}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {rec.location}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{rec.reason}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-ccb-blue">
                    {rec.recommendation_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">Score</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preferred Times */}
        {Object.keys(interestsData.activity_summary.preferred_times).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-ccb-blue" />
              Horarios Preferidos
            </h3>
            
            <div className="space-y-3">
              {Object.entries(interestsData.activity_summary.preferred_times)
                .sort(([,a], [,b]) => b - a)
                .map(([time, count]) => (
                  <div key={time} className="flex items-center justify-between">
                    <span className="capitalize text-gray-700">{time}</span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-ccb-blue h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(interestsData.activity_summary.preferred_times))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-gray-500">{count}</span>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        {/* Diversity Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-ccb-blue" />
            Diversidad Cultural
          </h3>
          
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${interestsData.diversity_score * 251.2} 251.2`}
                  initial={{ strokeDasharray: "0 251.2" }}
                  animate={{ strokeDasharray: `${interestsData.diversity_score * 251.2} 251.2` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#003087" />
                    <stop offset="100%" stopColor="#0066CC" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-gray-700">
                  {Math.round(interestsData.diversity_score * 100)}%
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              {interestsData.diversity_score > 0.7 
                ? 'Tienes intereses muy diversos' 
                : interestsData.diversity_score > 0.4 
                ? 'Tienes intereses variados' 
                : 'Tienes preferencias específicas'
              }
            </p>
          </div>
        </motion.div>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        Análisis actualizado: {new Date(interestsData.analysis_date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  )
}