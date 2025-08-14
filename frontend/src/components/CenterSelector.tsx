'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ChevronDown, 
  MapPin, 
  Check,
  Crown,
  Users
} from 'lucide-react';
import { useCenterSelector, useCurrentCenter } from '@/stores/centerStore';
import { useAuthStore } from '@/stores/auth';

interface CenterSelectorProps {
  className?: string;
  showFullInfo?: boolean;
}

export default function CenterSelector({ className = '', showFullInfo = false }: CenterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentCenter, availableCenters, canSwitchCenter, switchCenter } = useCenterSelector();
  const { centerInfo } = useCurrentCenter();
  const { user } = useAuthStore();

  const handleCenterSwitch = (centerId: string) => {
    if (canSwitchCenter) {
      switchCenter(centerId);
      setIsOpen(false);
    }
  };

  const currentCenterData = availableCenters.find(c => c.id === currentCenter);

  if (!user) return null;

  // Versión compacta para mostrar solo el nombre de la sede activa
  if (!showFullInfo) {
    return (
      <div className={`flex items-center space-x-2 text-sm ${className}`}>
        <Building2 className="w-4 h-4 text-ccb-blue" />
        <span className="font-medium text-gray-700">
          {currentCenterData?.name || 'Centro no encontrado'}
        </span>
        {user.role === 'super_admin' && (
          <Crown className="w-3 h-3 text-yellow-500" />
        )}
      </div>
    );
  }

  // Versión completa con selector (solo para super_admin)
  if (!canSwitchCenter) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-ccb-blue to-ccb-lightblue rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {currentCenterData?.name}
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              <MapPin className="w-3 h-3 mr-1" />
              <span>{currentCenterData?.city}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role === 'admin_local' ? 'Admin Local' : 
               user.role === 'editor_local' ? 'Editor' : 'Viewer'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white rounded-lg border border-gray-200 p-3 hover:border-ccb-blue transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-ccb-blue to-ccb-lightblue rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-medium text-gray-900">
                {currentCenterData?.name}
              </h3>
              <div className="flex items-center text-xs text-gray-500">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{currentCenterData?.city}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Crown className="w-4 h-4 text-yellow-500" />
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg border border-gray-200 shadow-lg z-20"
            >
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                  Seleccionar Centro Cultural
                </div>
                
                {availableCenters.map((center) => (
                  <button
                    key={center.id}
                    onClick={() => handleCenterSwitch(center.id)}
                    className={`w-full flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors ${
                      center.id === currentCenter
                        ? 'bg-ccb-blue/10 text-ccb-blue'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        center.id === currentCenter 
                          ? 'bg-ccb-blue text-white' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{center.name}</div>
                        <div className="text-xs text-gray-500">{center.city}</div>
                      </div>
                    </div>
                    
                    {center.id === currentCenter && (
                      <Check className="w-4 h-4 text-ccb-blue" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="border-t border-gray-100 px-2 py-2">
                <div className="text-xs text-gray-500 flex items-center">
                  <Users className="w-3 h-3 mr-1" />
                  Super Administrador - Acceso a todas las sedes
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}