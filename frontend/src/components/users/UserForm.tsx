'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUsersStore } from '@/stores/users';
import { User as UserType, UserCreate, UserUpdate } from '@/services/users';
import { useCurrentCenter } from '@/stores/centerStore';
import { useAuthStore } from '@/stores/auth';

// Validation schemas
const createUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),
  age: z.number()
    .min(13, 'La edad mínima es 13 años')
    .max(120, 'La edad máxima es 120 años'),
  location: z.string()
    .min(2, 'La ubicación debe tener al menos 2 caracteres')
    .max(100, 'La ubicación no puede exceder 100 caracteres'),
  center: z.enum(['santo-domingo', 'santiago']).optional(),
  role: z.enum(['super_admin', 'admin_local', 'editor_local', 'viewer']).optional(),
});

const updateUserSchema = z.object({
  name: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .optional(),
  email: z.string()
    .email('Email inválido')
    .max(255, 'El email no puede exceder 255 caracteres')
    .optional(),
  phone: z.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional(),
  age: z.number()
    .min(13, 'La edad mínima es 13 años')
    .max(120, 'La edad máxima es 120 años')
    .optional(),
  location: z.string()
    .min(2, 'La ubicación debe tener al menos 2 caracteres')
    .max(100, 'La ubicación no puede exceder 100 caracteres')
    .optional(),
  is_admin: z.boolean().optional(),
  center: z.enum(['santo-domingo', 'santiago']).optional(),
  role: z.enum(['super_admin', 'admin_local', 'editor_local', 'viewer']).optional(),
});

interface UserFormProps {
  user?: UserType | null;
  mode: 'create' | 'edit';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function UserForm({ user, mode, onSuccess, onCancel }: UserFormProps) {
  const router = useRouter();
  const { createUser, updateUser, loading } = useUsersStore();
  const { currentCenter } = useCurrentCenter();
  const { user: currentUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = mode === 'edit' && user;
  const schema = isEditing ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: user?.age || 18,
      location: user?.location || '',
      is_admin: user?.is_admin || false,
      center: (user as any)?.center || currentCenter,
      role: (user as any)?.role || 'viewer',
    } : {
      name: '',
      email: '',
      password: '',
      phone: '',
      age: 18,
      location: '',
      center: currentCenter,
      role: 'viewer',
    }
  });

  // Reset form when user changes
  useEffect(() => {
    if (isEditing && user) {
      reset({
        name: user.name,
        email: user.email,
        phone: user.phone,
        age: user.age,
        location: user.location,
        is_admin: user.is_admin,
        center: (user as any).center || currentCenter,
        role: (user as any).role || 'viewer',
      });
    }
  }, [user, isEditing, reset]);

  const onSubmit = async (data: any) => {
    try {
      setSubmitError(null);
      
      if (isEditing && user) {
        // Update user
        const updateData: UserUpdate = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          age: data.age,
          location: data.location,
          is_admin: data.is_admin,
          center: data.center,
          role: data.role,
        };
        
        await updateUser(user.id, updateData);
      } else {
        // Create user
        const createData: UserCreate = {
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          age: data.age,
          location: data.location,
          center: data.center,
          role: data.role,
        };
        
        await createUser(createData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/users');
      }
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'Error al guardar el usuario');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-ccb-blue/10 rounded-lg">
              <User className="w-6 h-6 text-ccb-blue" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? `Editar Usuario: ${user?.name}` : 'Crear Nuevo Usuario'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditing ? 'Actualiza la información del usuario' : 'Completa los datos del nuevo usuario'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        {/* Error Message */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{submitError}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Información Básica
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('name')}
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password (only for create mode) */}
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="809-123-4567"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Edad *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('age', { valueAsNumber: true })}
                  type="number"
                  min="13"
                  max="120"
                  placeholder="25"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                    errors.age ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ubicación *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  {...register('location')}
                  type="text"
                  placeholder="Santo Domingo, DN"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                    errors.location ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Multi-Center Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Configuración Multi-Sede
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Center Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Centro Cultural *
              </label>
              <select
                {...register('center')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                  errors.center ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={currentUser?.role !== 'super_admin'}
              >
                <option value="santo-domingo">Santo Domingo</option>
                <option value="santiago">Santiago</option>
              </select>
              {currentUser?.role !== 'super_admin' && (
                <p className="mt-1 text-xs text-gray-500">
                  Solo super administradores pueden cambiar el centro
                </p>
              )}
              {errors.center && (
                <p className="mt-1 text-sm text-red-600">{errors.center.message as string}</p>
              )}
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol del Usuario *
              </label>
              <select
                {...register('role')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue transition-colors ${
                  errors.role ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={currentUser?.role !== 'super_admin'}
              >
                <option value="viewer">Viewer - Solo lectura</option>
                <option value="editor_local">Editor Local - Crear/editar contenido</option>
                <option value="admin_local">Admin Local - Administrador de sede</option>
                {currentUser?.role === 'super_admin' && (
                  <option value="super_admin">Super Admin - Acceso total</option>
                )}
              </select>
              {currentUser?.role !== 'super_admin' && (
                <p className="mt-1 text-xs text-gray-500">
                  Solo super administradores pueden asignar roles
                </p>
              )}
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message as string}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Información sobre Roles:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Viewer:</strong> Solo puede ver contenido de su centro</li>
              <li><strong>Editor Local:</strong> Puede crear y editar eventos/noticias de su centro</li>
              <li><strong>Admin Local:</strong> Administrador completo de su centro</li>
              <li><strong>Super Admin:</strong> Acceso total a todos los centros</li>
            </ul>
          </div>
        </div>

        {/* Admin Permissions (legacy, only for edit mode) */}
        {isEditing && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Permisos
            </h3>
            
            <div className="flex items-center space-x-3">
              <input
                {...register('is_admin')}
                type="checkbox"
                id="is_admin"
                className="w-4 h-4 text-ccb-blue bg-gray-100 border-gray-300 rounded focus:ring-ccb-blue focus:ring-2"
              />
              <label htmlFor="is_admin" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Shield className="w-4 h-4" />
                <span>Permisos de Administrador</span>
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Los administradores pueden gestionar usuarios, eventos y configuraciones del sistema.
            </p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="px-6 py-3 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {(isSubmitting || loading) ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isEditing ? 'Actualizar' : 'Crear'} Usuario</span>
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}