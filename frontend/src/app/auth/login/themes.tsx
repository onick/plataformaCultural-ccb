"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Palette } from "lucide-react";
import ModernLoginPage from "./page";

// Diferentes temas de login para eventos
const loginThemes = [
  {
    id: "modern",
    name: "Moderno",
    component: ModernLoginPage,
    description: "Diseño contemporáneo con gradientes"
  },
  {
    id: "concert",
    name: "Concierto",
    bgGradient: "from-purple-900 via-blue-900 to-indigo-900",
    primaryColor: "purple",
    accentColor: "yellow",
    description: "Tema musical con colores vibrantes"
  },
  {
    id: "art",
    name: "Arte",
    bgGradient: "from-rose-900 via-pink-900 to-orange-900",
    primaryColor: "rose",
    accentColor: "amber",
    description: "Inspirado en galerías de arte"
  },
  {
    id: "cinema",
    name: "Cine",
    bgGradient: "from-gray-900 via-slate-900 to-black",
    primaryColor: "red",
    accentColor: "gold",
    description: "Tema cinematográfico clásico"
  },
  {
    id: "theater",
    name: "Teatro",
    bgGradient: "from-emerald-900 via-teal-900 to-cyan-900",
    primaryColor: "emerald",
    accentColor: "teal",
    description: "Elegancia teatral"
  }
];

export default function LoginThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState(0);
  const [showSelector, setShowSelector] = useState(false);

  const nextTheme = () => {
    setCurrentTheme((prev) => (prev + 1) % loginThemes.length);
  };

  const prevTheme = () => {
    setCurrentTheme((prev) => (prev - 1 + loginThemes.length) % loginThemes.length);
  };

  const theme = loginThemes[currentTheme];

  if (currentTheme === 0) {
    // Mostrar el componente moderno por defecto
    return (
      <div className="relative">
        <ModernLoginPage />
        
        {/* Theme Selector Button */}
        <div className="fixed top-4 left-4 z-50">
          <Button
            onClick={() => setShowSelector(!showSelector)}
            className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
            size="sm"
          >
            <Palette className="h-4 w-4 mr-2" />
            Temas
          </Button>
        </div>

        {/* Theme Selector Modal */}
        {showSelector && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6 max-w-md w-full">
              <h3 className="text-white text-lg font-semibold mb-4">Seleccionar Tema</h3>
              <div className="grid grid-cols-1 gap-3">
                {loginThemes.map((themeOption, index) => (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setCurrentTheme(index);
                      setShowSelector(false);
                    }}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      index === currentTheme
                        ? 'border-blue-400 bg-blue-500/20 text-white'
                        : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">{themeOption.name}</div>
                    <div className="text-sm opacity-70">{themeOption.description}</div>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setShowSelector(false)}
                className="w-full mt-4 bg-white/10 border border-white/20 text-white hover:bg-white/20"
              >
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Renderizar temas personalizados
  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.bgGradient} relative`}>
      {/* Theme Navigation */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <Button
          onClick={prevTheme}
          variant="ghost"
          size="sm"
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-lg text-white text-sm">
          {theme.name} ({currentTheme + 1}/{loginThemes.length})
        </div>

        <Button
          onClick={nextTheme}
          variant="ghost"
          size="sm"
          className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20"
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Themed Login Content */}
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8">
          {/* Left - Themed Promo */}
          <div className="hidden lg:flex flex-col justify-center text-white">
            <div className="space-y-6">
              <h1 className="text-5xl font-bold">
                {theme.name === "Concierto" && "🎵 Noches Musicales"}
                {theme.name === "Arte" && "🎨 Galerías Vivientes"}
                {theme.name === "Cine" && "🎬 Pantalla Grande"}
                {theme.name === "Teatro" && "🎭 Escenarios Mágicos"}
              </h1>
              
              <p className="text-xl opacity-90">
                {theme.name === "Concierto" && "Vive la música en vivo con los mejores artistas"}
                {theme.name === "Arte" && "Descubre obras que transforman espacios y corazones"}
                {theme.name === "Cine" && "Experimenta el séptimo arte como nunca antes"}
                {theme.name === "Teatro" && "Sumérgete en historias que cobran vida"}
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-2xl font-bold">200+</div>
                  <div className="text-sm opacity-75">Eventos este año</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20">
                  <div className="text-2xl font-bold">15K+</div>
                  <div className="text-sm opacity-75">Asistentes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Login Form */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Acceso {theme.name}</h2>
                <p className="text-gray-300 text-sm">{theme.description}</p>
              </div>

              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                    placeholder="admin@banreservas.com.do"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-white/50 focus:border-transparent backdrop-blur-sm"
                    placeholder="••••••••••••"
                  />
                </div>

                <Button className="w-full py-3 bg-white text-gray-900 hover:bg-gray-100 font-semibold rounded-lg transition-all duration-200">
                  Iniciar Sesión
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Tema: <span className="text-white font-medium">{theme.name}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}