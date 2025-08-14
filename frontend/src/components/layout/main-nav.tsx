"use client"

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Calendar, Users, LogOut, User, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Inicio", href: "/", icon: Calendar },
  { name: "Eventos", href: "/events", icon: Calendar },
  { name: "Noticias", href: "/news", icon: Newspaper },
  { name: "Mis Reservas", href: "/reservations", icon: Users },
];

export function MainNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    // Redirigir a la página de login después del logout
    window.location.href = '/auth/login';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-ccb-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CCB</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                Centro Cultural
              </span>
            </Link>

            {/* Desktop Navigation - Solo navegación pública */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors",
                      pathname === item.href
                        ? "border-ccb-blue text-ccb-blue"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <ThemeToggle />
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Hola, {user?.nombre || user?.email}
                </span>
                
                {/* Botón de acceso al admin solo para usuarios admin */}
                {(user as any)?.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex items-center bg-ccb-blue/10 border-ccb-blue text-ccb-blue hover:bg-ccb-blue hover:text-white"
                  >
                    <Link href="/admin">
                      <Calendar className="w-4 h-4 mr-2" />
                      Panel Admin
                    </Link>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center"
                >
                  <Link href="/profile">
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu - Solo navegación pública */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 dark:bg-gray-800">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors",
                    pathname === item.href
                      ? "bg-ccb-blue text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}

            <div className="border-t border-gray-300 dark:border-gray-600 my-2" />
            
            {isAuthenticated ? (
              <div className="px-3 py-2 space-y-2">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Hola, {user?.nombre || user?.email}
                </div>
                
                {/* Botón de acceso al admin en mobile */}
                {(user as any)?.is_admin && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center bg-ccb-blue/10 border-ccb-blue text-ccb-blue"
                    asChild
                  >
                    <Link href="/admin" onClick={() => setIsOpen(false)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Panel Admin
                    </Link>
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  asChild
                >
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <User className="w-4 h-4 mr-2" />
                    Mi Perfil
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/auth/login">Iniciar Sesión</Link>
                </Button>
                <Button size="sm" className="w-full" asChild>
                  <Link href="/auth/register">Registrarse</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
