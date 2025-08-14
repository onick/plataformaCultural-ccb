'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/stores/auth'
import { 
  LayoutDashboard, 
  Calendar, 
  UserCheck, 
  Users, 
  FileBarChart, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Building2
} from 'lucide-react'

interface SidebarItem {
  name: string
  href: string
  icon: React.ComponentType<any>
  badge?: number
  subItems?: Omit<SidebarItem, 'subItems'>[]
}

const sidebarItems: SidebarItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Eventos',
    href: '/admin/events',
    icon: Calendar,
    subItems: [
      { name: 'Lista de Eventos', href: '/admin/events', icon: Calendar },
      { name: 'Calendario', href: '/admin/events/calendar', icon: Calendar }
    ]
  },
  {
    name: 'Check-in',
    href: '/admin/checkin',
    icon: UserCheck
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'Reportes',
    href: '/admin/reports',
    icon: FileBarChart
  }
]

interface AdminSidebarProps {
  className?: string
}

export default function AdminSidebar({ className = '' }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()
  const { user, logout } = useAuthStore()

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile sidebar when pathname changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  const toggleItem = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const isItemActive = (item: SidebarItem) => {
    if (item.subItems) {
      return item.subItems.some(subItem => pathname === subItem.href)
    }
    return pathname === item.href
  }

  const SidebarContent = () => (
    <motion.div 
      className={`flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${
        isCollapsed ? 'w-20' : 'w-72'
      } transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 bg-gradient-to-r from-ccb-blue to-ccb-lightblue rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 dark:text-white">CCB</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Admin Panel</span>
            </div>
          )}
        </div>
        
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:block hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => (
          <div key={item.name}>
            <div
              className={`
                group flex items-center w-full p-3 text-sm font-medium rounded-lg transition-all duration-200
                ${isItemActive(item)
                  ? 'bg-ccb-blue text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
                ${isCollapsed ? 'justify-center' : 'justify-between'}
              `}
            >
              {item.subItems ? (
                <button
                  onClick={() => toggleItem(item.name)}
                  className="flex items-center w-full"
                >
                  <div className="flex items-center">
                    <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                    {!isCollapsed && <span>{item.name}</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronRight 
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedItems.includes(item.name) ? 'rotate-90' : ''
                      }`} 
                    />
                  )}
                </button>
              ) : (
                <Link 
                  href={item.href}
                  className="flex items-center w-full"
                >
                  <item.icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && <span>{item.name}</span>}
                  {item.badge && !isCollapsed && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}
            </div>

            {/* Sub-items */}
            {item.subItems && (
              <AnimatePresence>
                {expandedItems.includes(item.name) && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="ml-6 mt-2 space-y-1 overflow-hidden"
                  >
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={`
                          flex items-center p-2 text-sm rounded-lg transition-colors duration-200
                          ${pathname === subItem.href
                            ? 'bg-ccb-blue/20 text-ccb-blue'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                        `}
                      >
                        <subItem.icon className="w-4 h-4 mr-2" />
                        {subItem.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && user && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-ccb-blue to-ccb-lightblue rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Link
            href="/admin/settings"
            className={`
              flex items-center w-full p-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Configuración</span>}
          </Link>

          <button
            onClick={logout}
            className={`
              flex items-center w-full p-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200
              ${isCollapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Expand button for collapsed state */}
      {isCollapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsCollapsed(false)}
            className="w-full p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            title="Expandir sidebar"
          >
            <ChevronRight className="w-5 h-5 mx-auto" />
          </button>
        </div>
      )}
    </motion.div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <div className={`hidden lg:block ${className}`}>
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed left-0 top-0 h-full z-50 lg:hidden"
            >
              <div className="relative">
                <SidebarContent />
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}