'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { motion } from 'framer-motion'

interface BreadcrumbItem {
  label: string
  href: string
  isActive?: boolean
}

const pathNameMap: Record<string, string> = {
  admin: 'Dashboard',
  events: 'Eventos',
  calendar: 'Calendario',
  create: 'Crear Evento',
  checkin: 'Registros & Check-ins', // Actualizado para reflejar nueva organización
  users: 'Usuarios',
  analytics: 'Analytics',
  reports: 'Reportes',
  settings: 'Configuración',
  news: 'Noticias'
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Always start with Dashboard
    breadcrumbs.push({
      label: 'Dashboard',
      href: '/admin',
      isActive: pathname === '/admin'
    })
    
    // Handle special cases for reorganized menu structure
    if (pathname === '/admin/analytics/events') {
      // Analytics de eventos está bajo "Eventos" en el menú
      breadcrumbs.push({
        label: 'Eventos',
        href: '/admin/events',
        isActive: false
      })
      breadcrumbs.push({
        label: 'Analytics',
        href: '/admin/analytics/events',
        isActive: true
      })
      return breadcrumbs
    }
    
    if (pathname === '/admin/checkin') {
      // Check-in está bajo "Eventos" en el menú
      breadcrumbs.push({
        label: 'Eventos',
        href: '/admin/events',
        isActive: false
      })
      breadcrumbs.push({
        label: 'Registros & Check-ins',
        href: '/admin/checkin',
        isActive: true
      })
      return breadcrumbs
    }
    
    // Handle legacy analytics routes that may still exist
    if (pathname === '/admin/analytics') {
      // Redirect analytics dashboard to reports or main dashboard
      breadcrumbs.push({
        label: 'Reportes',
        href: '/admin/reports',
        isActive: true
      })
      return breadcrumbs
    }
    
    if (pathname === '/admin/analytics/users') {
      // Users analytics is now under Usuarios main section
      breadcrumbs.push({
        label: 'Usuarios',
        href: '/admin/users',
        isActive: false
      })
      breadcrumbs.push({
        label: 'Analytics',
        href: '/admin/analytics/users',
        isActive: true
      })
      return breadcrumbs
    }
    
    // Build breadcrumbs from path segments for other routes
    if (segments.length > 1) {
      let currentPath = ''
      
      segments.slice(1).forEach((segment, index) => {
        currentPath += `/${segment}`
        const fullPath = `/admin${currentPath}`
        const isLast = index === segments.length - 2
        
        breadcrumbs.push({
          label: pathNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
          href: fullPath,
          isActive: isLast
        })
      })
    }
    
    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center space-x-2 text-sm text-gray-600 mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
    >
      <Home size={16} className="text-ccb-blue" />
      
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight size={14} className="text-gray-400" />
          )}
          
          {item.isActive ? (
            <span className="font-medium text-ccb-blue">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-ccb-blue transition-colors duration-200"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </motion.nav>
  )
}