'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Image, 
  Tag,
  Save,
  ArrowLeft,
  Plus,
  X,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { apiService, EventCreate } from '@/services/api';
import type { EventCategory } from '@/types';
import { SPANISH_CATEGORIES } from '@/utils/eventUtils';

// Validation schema
const eventSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'Máximo 100 caracteres'),
  description: z.string().min(1, 'La descripción es requerida').max(500, 'Máximo 500 caracteres'),
  category: z.string().min(1, 'La categoría es requerida'),
  date: z.string().min(1, 'La fecha es requerida'),
  time: z.string().min(1, 'La hora es requerida'),
  location: z.string().min(1, 'La ubicación es requerida'),
  capacity: z.number().min(1, 'La capacidad debe ser mayor a 0').max(1000, 'Máximo 1000 personas'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional().or(z.literal('')),
  requirements: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional()
});

type EventFormData = z.infer<typeof eventSchema>;

export default function EditEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      date: '',
      time: '',
      location: 'Centro Cultural Banreservas',
      capacity: 50,
      price: 0,
      tags: [],
      imageUrl: '',
      requirements: '',
      contactEmail: '',
      contactPhone: ''
    }
  });

  const watchedTags = watch('tags') || [];

  useEffect(() => {
    loadEventData();
    loadCategories();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🎯 EditEventPage: Loading event data for ID:', eventId);
      
      const event = await apiService.getEvent(eventId);
      console.log('✅ EditEventPage: Event data loaded:', event);
      
      setEventData(event);
      
      // Populate form with event data
      reset({
        title: event.title || '',
        description: event.description || '',
        category: event.category || '',
        date: event.date || '',
        time: event.time || '',
        location: event.location || 'Centro Cultural Banreservas',
        capacity: event.capacity || 50,
        price: event.price || 0,
        tags: event.tags || [],
        imageUrl: event.image_url || '',
        requirements: event.requirements || '',
        contactEmail: event.contact_info?.email || '',
        contactPhone: event.contact_info?.phone || ''
      });
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error loading event data';
      console.error('🚨 EditEventPage: Error loading event:', error);
      setError(errorMsg);
      
      // Log error
      if (window.logError) {
        window.logError(errorMsg, 'EditEventPage - loadEventData()', {
          error: error instanceof Error ? error.stack : error,
          eventId,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesList = await apiService.getEventCategories();
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(SPANISH_CATEGORIES);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log('Updating event:', data);
      
      // Prepare event data for API
      const eventUpdateData: EventCreate = {
        title: data.title,
        description: data.description,
        category: data.category as EventCategory,
        date: data.date,
        time: data.time,
        location: data.location,
        capacity: data.capacity,
        price: data.price || 0,
        tags: data.tags || [],
        image_url: data.imageUrl || '',
        requirements: data.requirements || '',
        contact_info: {
          email: data.contactEmail || '',
          phone: data.contactPhone || ''
        },
        published: true
      };
      
      // Call API to update event
      const updatedEvent = await apiService.updateEvent(eventId, eventUpdateData);
      
      console.log('Event updated successfully:', updatedEvent);
      
      // Show success message
      alert('¡Evento actualizado exitosamente!');
      
      // Redirect to events list
      router.push('/admin/events');
      
    } catch (error) {
      console.error('Error updating event:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al actualizar el evento: ${errorMessage}`);
      
      // Log error
      if (window.logError) {
        window.logError(errorMessage, 'EditEventPage - onSubmit()', {
          error: error instanceof Error ? error.stack : error,
          eventId,
          formData: data
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !watchedTags.includes(newTag.trim())) {
      setValue('tags', [...watchedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue('tags', watchedTags.filter(tag => tag !== tagToRemove));
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ccb-blue mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando datos del evento...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !eventData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error al cargar el evento</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <Link
            href="/admin/events"
            className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
          >
            Volver a Eventos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link
              href="/admin/events"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-ccb-blue hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Editar Evento</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Actualiza los detalles del evento "{eventData?.title}"
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div className="p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Información Básica</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Título del Evento *
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    placeholder="Ej: Concierto de Jazz Latino"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Categoría *
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                  )}
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ubicación *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register('location')}
                      type="text"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="Centro Cultural Banreservas"
                    />
                  </div>
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    placeholder="Describe el evento..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Date and Time */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Fecha y Hora</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fecha *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register('date')}
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date.message}</p>
                  )}
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hora *
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register('time')}
                      type="time"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {errors.time && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.time.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Capacity and Pricing */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Capacidad y Precio</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacidad *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register('capacity', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      max="1000"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="50"
                    />
                  </div>
                  {errors.capacity && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity.message}</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio (RD$)
                  </label>
                  <input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.price.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Información Adicional</h2>
              
              <div className="space-y-6">
                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL de Imagen
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      {...register('imageUrl')}
                      type="url"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                  {errors.imageUrl && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.imageUrl.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {watchedTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-ccb-blue/10 text-ccb-blue dark:bg-ccb-blue/20"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="Agregar etiqueta"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Requisitos
                  </label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                    placeholder="Edad mínima, materiales necesarios, etc."
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      {...register('contactEmail')}
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="contacto@banreservas.com.do"
                    />
                    {errors.contactEmail && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      {...register('contactPhone')}
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                      placeholder="(809) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/admin/events"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Actualizar Evento</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}