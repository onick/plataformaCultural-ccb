"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  FileText, 
  Clock, 
  Tag, 
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { apiService } from '@/services/api';

interface QuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  onEventCreated: (event: any) => void;
  onGoToFullForm: (eventData: any) => void;
}

const QuickEventModal: React.FC<QuickEventModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onEventCreated,
  onGoToFullForm
}) => {
  const [formData, setFormData] = useState({
    title: '',
    time: '09:00',
    category: '',
    status: 'active',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Cargar categorías disponibles
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        time: '09:00',
        category: '',
        status: 'active',
        description: ''
      });
      setError(null);
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const categoriesList = await apiService.getEventCategories();
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback categories
      setCategories([
        'Cinema Dominicano',
        'Cine Clásico', 
        'Cine General',
        'Conciertos',
        'Talleres',
        'Exposiciones de Arte',
        'Charlas/Conferencias',
        'Experiencias 3D Inmersivas'
      ]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuickSave = async () => {
    if (!formData.title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!formData.category) {
      setError('La categoría es requerida');
      return;
    }

    if (!selectedDate) {
      setError('Fecha no seleccionada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Crear evento básico
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || `Evento creado desde calendario para ${formData.title}`,
        category: formData.category,
        date: selectedDate.toISOString().split('T')[0],
        time: formData.time,
        capacity: 50, // Default capacity
        location: 'Centro Cultural Banreservas', // Default location
        published: formData.status === 'active',
        price: 0,
        requirements: '',
        tags: [formData.category.toLowerCase()],
        contact_info: {
          email: 'eventos@ccb.do',
          phone: '(809) 555-0123'
        }
      };

      console.log('Creating quick event:', eventData);

      const createdEvent = await apiService.createEvent(eventData);
      
      console.log('Event created successfully:', createdEvent);

      // Notificar éxito
      if (window.logError) {
        window.logError('Evento creado exitosamente', 'QuickEventModal - handleQuickSave()', {
          eventId: createdEvent.id,
          eventTitle: createdEvent.title,
          timestamp: new Date().toISOString()
        });
      }

      // Callback para actualizar el calendario
      onEventCreated(createdEvent);
      
      // Cerrar modal
      onClose();
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al crear el evento';
      console.error('Error creating quick event:', error);
      setError(errorMsg);
      
      // Log error
      if (window.logError) {
        window.logError(errorMsg, 'QuickEventModal - handleQuickSave()', {
          error: error instanceof Error ? error.stack : error,
          formData,
          selectedDate: selectedDate?.toISOString()
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoToFullForm = () => {
    // Preparar datos para el formulario completo
    const eventData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      date: selectedDate?.toISOString().split('T')[0],
      time: formData.time,
      status: formData.status
    };
    
    onGoToFullForm(eventData);
    onClose();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-ccb-blue/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-ccb-blue" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Crear Evento Rápido
                  </h2>
                  {selectedDate && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {formatDate(selectedDate)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Título del Evento *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Taller de Fotografía Digital"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                  autoFocus
                />
              </div>

              {/* Hora */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 inline mr-2" />
                  Categoría *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                >
                  <option value="active">Activo</option>
                  <option value="draft">Borrador</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Descripción opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Breve descripción del evento..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleQuickSave}
                disabled={loading || !formData.title.trim() || !formData.category}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{loading ? 'Guardando...' : 'Guardar Evento'}</span>
              </button>
              
              <button
                onClick={handleGoToFullForm}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Formulario Completo</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default QuickEventModal;