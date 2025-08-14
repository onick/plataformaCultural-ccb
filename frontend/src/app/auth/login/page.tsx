"use client"

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/auth";
import { Eye, EyeOff, LogIn, Music, Palette, Camera, Star, Users, Calendar, Award } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function ModernLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      // Redirect to admin after successful login
      window.location.href = '/admin';
    } catch (error) {
      console.error('Login error:', error);
      // Handle error - could show toast notification here
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Left Side - Visual/Promo Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        
        {/* Floating Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-pink-400 to-orange-500 rounded-full blur-lg opacity-40 animate-bounce" />
          <div className="absolute bottom-32 left-32 w-40 h-40 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-30 animate-pulse" />
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-gradient-to-br from-yellow-400 to-red-500 rounded-full blur-lg opacity-50 animate-bounce" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Centro Cultural Banreservas
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Descubre experiencias culturales únicas y conecta con el arte en todas sus formas
            </p>
          </div>

          {/* Features Cards */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Conciertos Exclusivos</h3>
                <p className="text-blue-200">Jazz, clásica, contemporánea y más</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-lg">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Exposiciones de Arte</h3>
                <p className="text-blue-200">Obras de artistas dominicanos e internacionales</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Cine y Documentales</h3>
                <p className="text-blue-200">Proyecciones especiales y cine dominicano</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Talleres Culturales</h3>
                <p className="text-blue-200">Aprende con expertos en diversas disciplinas</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-white flex items-center justify-center">
                <Calendar className="h-6 w-6 mr-2" />
                500+
              </div>
              <div className="text-sm text-blue-200">Eventos Anuales</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-white flex items-center justify-center">
                <Users className="h-6 w-6 mr-2" />
                50K+
              </div>
              <div className="text-sm text-blue-200">Visitantes</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg backdrop-blur-sm">
              <div className="text-3xl font-bold text-white flex items-center justify-center">
                <Star className="h-6 w-6 mr-2" />
                15
              </div>
              <div className="text-sm text-blue-200">Años de Historia</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-lg border border-white/20 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-2">¿Eres nuevo aquí?</h3>
            <p className="text-blue-200 mb-4">Únete a nuestra comunidad cultural y disfruta de experiencias únicas</p>
            <Link href="/auth/register">
              <Button className="bg-white text-slate-900 hover:bg-gray-100 font-semibold">
                Crear Cuenta Gratis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-2xl">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-gray-400">
              Accede a tu cuenta para gestionar eventos y reservas
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@banreservas.com.do"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-red-400 text-sm flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm flex items-center">
                  <span className="mr-1">⚠️</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded bg-white/10 border-white/20 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-300">Recordarme</span>
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </div>
              )}
            </Button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4">
            <div className="text-sm text-gray-400">
              ¿No tienes cuenta?{" "}
              <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
                Crear cuenta
              </Link>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-gray-500">
                Centro Cultural Banreservas © 2025
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <span className="text-lg mr-2">🎭</span>
              <p className="text-sm text-yellow-300 font-medium">Credenciales de demostración</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-yellow-200 font-mono">📧 admin@banreservas.com.do</p>
              <p className="text-xs text-yellow-200 font-mono">🔑 Admin2024CCB!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}