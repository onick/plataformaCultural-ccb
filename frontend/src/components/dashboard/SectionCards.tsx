"use client"

import * as React from "react"
import { 
  Calendar, 
  Users, 
  BarChart3, 
  Ticket, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Eye,
  CheckCircle,
  AlertCircle
} from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface MetricCard {
  title: string
  value: string | number
  description?: string
  icon: React.ElementType
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  variant?: "default" | "success" | "warning" | "destructive"
}

interface SectionCardsProps {
  metrics?: {
    totalEvents: number
    totalUsers: number
    totalReservations: number
    todayCheckIns: number
    activeEvents: number
    upcomingEvents: number
    occupancyRate: number
  }
  loading?: boolean
}

export function SectionCards({ metrics, loading }: SectionCardsProps) {
  const cards: MetricCard[] = React.useMemo(() => [
    {
      title: "Total de Eventos",
      value: loading ? "..." : (metrics?.totalEvents || 0),
      description: "Eventos creados",
      icon: Calendar,
      trend: {
        value: 12,
        label: "desde el mes pasado",
        isPositive: true
      }
    },
    {
      title: "Usuarios Registrados",
      value: loading ? "..." : (metrics?.totalUsers || 0),
      description: "Usuarios activos",
      icon: Users,
      trend: {
        value: 8,
        label: "nuevos esta semana",
        isPositive: true
      }
    },
    {
      title: "Reservas Totales",
      value: loading ? "..." : (metrics?.totalReservations || 0),
      description: "Reservas confirmadas",
      icon: Ticket,
      trend: {
        value: 15,
        label: "vs semana anterior",
        isPositive: true
      }
    },
    {
      title: "Check-ins Hoy",
      value: loading ? "..." : (metrics?.todayCheckIns || 0),
      description: "Asistencia confirmada",
      icon: CheckCircle,
      variant: "success"
    }
  ], [metrics, loading])

  const secondaryCards: MetricCard[] = React.useMemo(() => [
    {
      title: "Eventos Activos",
      value: loading ? "..." : (metrics?.activeEvents || 0),
      description: "En curso o próximos",
      icon: Eye,
      variant: "default"
    },
    {
      title: "Próximos Eventos",
      value: loading ? "..." : (metrics?.upcomingEvents || 0),
      description: "Esta semana",
      icon: Clock,
      variant: "warning"
    },
    {
      title: "Tasa de Ocupación",
      value: loading ? "..." : `${Math.round(metrics?.occupancyRate || 0)}%`,
      description: "Promedio general",
      icon: BarChart3,
      trend: {
        value: metrics?.occupancyRate || 0 > 70 ? 5 : -3,
        label: "vs mes anterior",
        isPositive: (metrics?.occupancyRate || 0) > 70
      },
      variant: (metrics?.occupancyRate || 0) > 70 ? "success" : "warning"
    }
  ], [metrics, loading])

  const getVariantStyles = (variant?: string) => {
    switch (variant) {
      case "success":
        return "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/50"
      case "warning":
        return "border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/50"
      case "destructive":
        return "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/50"
      default:
        return ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={cn(getVariantStyles(card.variant))}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.description && (
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                )}
                {card.trend && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                    {card.trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={card.trend.isPositive ? "text-green-600" : "text-red-600"}>
                      +{Math.abs(card.trend.value)}%
                    </span>
                    <span>{card.trend.label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        {secondaryCards.map((card, index) => {
          const Icon = card.icon
          return (
            <Card key={index} className={cn(getVariantStyles(card.variant))}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                {card.description && (
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                )}
                {card.trend && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
                    {card.trend.isPositive ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={card.trend.isPositive ? "text-green-600" : "text-red-600"}>
                      {card.trend.isPositive ? '+' : ''}{card.trend.value}%
                    </span>
                    <span>{card.trend.label}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado del Sistema</CardTitle>
          <CardDescription>
            Vista rápida del estado operativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Sistema Operativo</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Última actualización: hace 5 min
              </Badge>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-green-600">99.9%</div>
              <div className="text-xs text-muted-foreground">Disponibilidad</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">1.2s</div>
              <div className="text-xs text-muted-foreground">Tiempo respuesta</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">47ms</div>
              <div className="text-xs text-muted-foreground">Latencia DB</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}