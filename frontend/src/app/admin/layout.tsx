'use client'

import React from 'react'

import { AppSidebar } from '@/components/AppSidebar'
import { AdminHeader } from '@/components/AdminHeader'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import AuthGuard from '@/components/AuthGuard'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Use client-side default for sidebar state
  const defaultOpen = true

  return (
    <AuthGuard requireAdmin={true}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset>
          <AdminHeader 
            title="Panel de Administración"
            description="Gestiona eventos, usuarios y configura el sistema"
          />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGuard>
  )
}
