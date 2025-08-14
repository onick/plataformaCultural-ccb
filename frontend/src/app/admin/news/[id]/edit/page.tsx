'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Upload, 
  X, 
  Image as ImageIcon,
  FileText,
  Tag,
  Calendar,
  Globe,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from '@/components/ui/rich-text-editor';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url?: string;
  category: string;
  date: string;
  status: 'published' | 'draft' | 'archived';
  author: string;
  views: number;
}

interface EditNewsPageProps {
  params: {
    id: string;
  };
}

export default function EditNewsPage({ params }: EditNewsPageProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalData, setOriginalData] = useState<NewsItem | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: '',
    status: 'draft' as 'published' | 'draft' | 'archived',
    image: null as File | null,
    image_url: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const categories = [
    'Arte Digital',
    'Cinema',
    'Educación',
    'Fotografía',
    'Música',
    'Teatro',
    'Danza',
    'Literatura',
    'Exposiciones',
    'Talleres',
    'Conferencias',
    'Eventos Especiales'
  ];

  // Datos de ejemplo (igual que en la página de gestión)
  const mockArticles: {[key: string]: NewsItem} = {
    '1': {
      id: '1',
      title: 'Nueva Galería de Arte Digital Inmersiva',
      description: 'Experimenta el arte como nunca antes con nuestra nueva instalación de realidad virtual',
                content: `<p>El Centro Cultural Banreservas se complace en anunciar la apertura de su nueva <strong>Galería de Arte Digital Inmersiva</strong>, un espacio revolucionario que combina tecnología de vanguardia con expresiones artísticas contemporáneas.</p>

<h2>Una Experiencia Única</h2>
<p>Esta innovadora galería utiliza tecnología de <em>realidad virtual y aumentada</em> para crear experiencias artísticas inmersivas que transportan a los visitantes a mundos completamente nuevos. Los artistas pueden ahora expresar su creatividad de maneras antes inimaginables.</p>

<h2>Tecnología de Vanguardia</h2>
<p>La galería cuenta con:</p>
<ul>
<li>Proyectores 4K de última generación</li>
<li>Sistemas de sonido envolvente</li>
<li>Sensores de movimiento para interacción</li>
<li>Plataformas de realidad virtual</li>
</ul>

<h2>Exhibición Inaugural</h2>
<p>La exhibición inaugural <strong>"Mundos Digitales"</strong> presenta obras de 15 artistas dominicanos e internacionales que exploran temas como:</p>
<ol>
<li>La identidad digital</li>
<li>La conectividad humana</li>
<li>El futuro de la expresión artística</li>
</ol>

<blockquote>Las visitas están disponibles de martes a domingo, de 10:00 AM a 6:00 PM. La entrada es gratuita para estudiantes y adultos mayores, y tiene un costo de RD$200 para el público general.</blockquote>

<p>Para más información y reservas, visite nuestro sitio web o llame al <a href="tel:+18091234567">(809) 123-4567</a>.</p>`,
      image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
      category: 'Arte Digital',
      date: '2024-01-15',
      status: 'published',
      author: 'CCB Admin',
      views: 234
    },
    '2': {
      id: '2',
      title: 'Festival de Cinema Dominicano 2025',
      description: 'Celebramos nuestro patrimonio cinematográfico con 15 películas nacionales',
      content: `El Centro Cultural Banreservas presenta la segunda edición del Festival de Cinema Dominicano, un evento que celebra la rica tradición cinematográfica de nuestro país y proyecta su futuro.

Programación

Durante una semana completa, del 1 al 7 de febrero, proyectaremos 15 películas que representan lo mejor del cine dominicano contemporáneo, desde documentales hasta largometrajes de ficción.

Películas Destacadas

• "Nueba Yol 3: El Regreso" - Dirigida por Ángel Muñiz
• "Los Héroes de otra Historia" - Documental de Aurora Martínez
• "Caribeño" - Drama dirigido por Miguel Céspedes
• "La Soga 3" - Acción y suspenso de Josh Crook

Eventos Especiales

Además de las proyecciones, el festival incluye:
• Conversatorios con directores
• Talleres de guión y producción
• Mesa redonda sobre el futuro del cine dominicano
• Ceremonia de premiación

La entrada es gratuita para todas las proyecciones, pero requiere reserva previa debido al aforo limitado.`,
      image_url: 'https://images.unsplash.com/photo-1489599512406-ab09dfb9c2c1?w=800&h=400&fit=crop',
      category: 'Cinema',
      date: '2024-01-10',
      status: 'published',
      author: 'CCB Admin',
      views: 456
    },
    '3': {
      id: '3',
      title: 'Talleres Gratuitos para Jóvenes Artistas',
      description: 'Nuevos cupos disponibles en fotografía, música y artes visuales',
      content: `El Centro Cultural Banreservas anuncia la apertura de inscripciones para sus talleres gratuitos dirigidos a jóvenes de 14 a 25 años interesados en desarrollar sus habilidades artísticas.

Talleres Disponibles

Fotografía Digital
Aprende los fundamentos de la fotografía digital, composición, manejo de luz y edición básica. Incluye préstamo de equipo profesional.
• Duración: 8 semanas
• Horario: Sábados 9:00 AM - 12:00 PM
• Cupos: 15 estudiantes

Producción Musical
Introducción a la producción musical digital, grabación, mezcla y mastering usando software profesional.
• Duración: 10 semanas
• Horario: Miércoles 6:00 PM - 9:00 PM
• Cupos: 12 estudiantes

Artes Visuales
Explora diferentes técnicas de artes visuales incluyendo dibujo, pintura, escultura y arte digital.
• Duración: 6 semanas
• Horario: Viernes 4:00 PM - 7:00 PM
• Cupos: 20 estudiantes

Requisitos
• Edad entre 14 y 25 años
• Llenar formulario de inscripción
• Carta de motivación (máximo 200 palabras)
• Compromiso de asistencia del 80%

Las inscripciones están abiertas hasta el 31 de enero. Los talleres inician la primera semana de febrero.`,
      image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop',
      category: 'Educación',
      date: '2024-01-08',
      status: 'draft',
      author: 'CCB Admin',
      views: 89
    },
    '4': {
      id: '4',
      title: 'Exposición de Fotografía Urbana',
      description: 'Artistas locales capturan la esencia de Santo Domingo',
      content: `Una nueva exposición de fotografía urbana abre sus puertas en el Centro Cultural Banreservas, presentando la obra de talentosos artistas locales que han capturado la esencia vibrante de Santo Domingo.

La Mirada Urbana

Esta exposición reúne más de 50 fotografías que documentan la vida cotidiana, la arquitectura y los momentos únicos que definen nuestra capital. Desde los barrios históricos hasta los modernos desarrollos urbanos.

Artistas Participantes

• María Rodríguez - Serie "Calles que Hablan"
• Carlos Pérez - "Santo Domingo en Blanco y Negro"
• Ana Martínez - "Rostros de la Ciudad"
• José López - "Arquitectura Colonial vs Moderna"

Técnicas y Estilos

La muestra incluye diferentes enfoques fotográficos:
• Fotografía documental
• Street photography
• Retratos urbanos
• Arquitectura contemporánea

La exposición estará abierta hasta el 28 de febrero con entrada gratuita para todos los visitantes.`,
      image_url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=400&fit=crop',
      category: 'Fotografía',
      date: '2024-01-05',
      status: 'archived',
      author: 'CCB Admin',
      views: 123
    }
  };

  useEffect(() => {
    loadNewsItem();
  }, [params.id]);

  const loadNewsItem = async () => {
    try {
      setLoading(true);
      
      // Cargar desde localStorage primero
      const savedNews = localStorage.getItem('ccb-news');
      let allNews = [];
      
      if (savedNews) {
        try {
          allNews = JSON.parse(savedNews);
        } catch (error) {
          console.error('Error parsing saved news:', error);
        }
      }
      
      // Si no hay datos guardados, usar datos de ejemplo
      if (allNews.length === 0) {
        allNews = Object.values(mockArticles);
      }
      
      // Buscar la noticia por ID
      const newsItem = allNews.find((article: any) => article.id === params.id);
      
      // Simular carga desde API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!newsItem) {
        router.push('/admin/news');
        return;
      }

      setOriginalData(newsItem);
      setFormData({
        title: newsItem.title,
        description: newsItem.description,
        content: newsItem.content,
        category: newsItem.category,
        status: newsItem.status,
        image: null,
        image_url: newsItem.image_url || ''
      });
      
      if (newsItem.image_url) {
        setImagePreview(newsItem.image_url);
      }
      
    } catch (error) {
      console.error('Error loading news item:', error);
      router.push('/admin/news');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null, image_url: '' }));
    setImagePreview(null);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'El contenido es obligatorio';
    }
    
    if (!formData.category) {
      newErrors.category = 'La categoría es obligatoria';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Cargar noticias existentes
      const savedNews = localStorage.getItem('ccb-news');
      let allNews = [];
      
      if (savedNews) {
        try {
          allNews = JSON.parse(savedNews);
        } catch (error) {
          console.error('Error parsing saved news:', error);
        }
      }

      // Actualizar la noticia
      const updatedNews = allNews.map((news: any) => {
        if (news.id === params.id) {
          return {
            ...news,
            title: formData.title,
            description: formData.description,
            content: formData.content,
            category: formData.category,
            status: status,
            image_url: imagePreview || news.image_url,
            updated_at: new Date().toISOString()
          };
        }
        return news;
      });

      // Guardar en localStorage
      localStorage.setItem('ccb-news', JSON.stringify(updatedNews));
      
      console.log('Noticia actualizada exitosamente');
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      router.push('/admin/news');
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.')) {
      return;
    }

    setSaving(true);
    try {
      // Aquí iría la llamada a la API para eliminar
      console.log('Eliminando noticia:', params.id);
      
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push('/admin/news');
    } catch (error) {
      console.error('Error al eliminar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    
    return (
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.content !== originalData.content ||
      formData.category !== originalData.category ||
      formData.status !== originalData.status ||
      formData.image !== null ||
      formData.image_url !== originalData.image_url
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ccb-blue mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando noticia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/admin/news"
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Editar Noticia
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Modifica el contenido y configuración del artículo
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleDelete}
            disabled={saving}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
          <Button
            variant="outline"
            onClick={() => handleSave('draft')}
            disabled={saving || !hasChanges()}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Borrador'}
          </Button>
          <Button
            onClick={() => handleSave('published')}
            disabled={saving || !hasChanges()}
            className="bg-ccb-blue hover:bg-ccb-blue/90"
          >
            <Globe className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Publicar Cambios'}
          </Button>
        </div>
      </div>

      {/* Changes Indicator */}
      {hasChanges() && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <p className="text-yellow-800 text-sm">
            ⚠️ Tienes cambios sin guardar. No olvides guardar o publicar tus modificaciones.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Título de la noticia"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción Corta *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white ${
                    errors.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Descripción breve que aparecerá en la lista de noticias"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Imagen de Cabecera
              </CardTitle>
            </CardHeader>
            <CardContent>
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {formData.image ? 'Nueva imagen seleccionada' : 'Imagen actual'}
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Arrastra una imagen aquí o haz clic para seleccionar
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG hasta 5MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="mt-4 inline-flex items-center px-4 py-2 bg-ccb-blue text-white rounded-lg hover:bg-ccb-blue/90 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Seleccionar Imagen
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Contenido del Artículo *</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                value={formData.content}
                onChange={(value) => handleInputChange('content', value)}
                placeholder="Escribe el contenido completo del artículo..."
                error={errors.content}
                height={400}
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Usa el editor visual para dar formato a tu contenido: títulos, listas, enlaces, imágenes y más.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="w-5 h-5 mr-2" />
                Opciones de Publicación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="archived">Archivado</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white ${
                    errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category}</p>
                )}
              </div>

              {/* Statistics */}
              {originalData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Estadísticas
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Vistas:</span>
                      <span className="font-medium">{originalData.views}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Creado:</span>
                      <span className="font-medium">
                        {new Date(originalData.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Autor:</span>
                      <span className="font-medium">{originalData.author}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Vista Previa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {imagePreview && (
                  <img 
                    src={imagePreview} 
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {formData.category && (
                      <Badge variant="secondary" className="text-xs">
                        {formData.category}
                      </Badge>
                    )}
                    <Badge className={
                      formData.status === 'published' ? 'bg-green-100 text-green-800' :
                      formData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {formData.status === 'published' ? 'Publicado' :
                       formData.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {formData.title || 'Título de la noticia'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.description || 'Descripción de la noticia...'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start"
              >
                <Link href={`/news/${params.id}`} target="_blank">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Artículo Público
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="w-full justify-start"
              >
                <Link href="/admin/news">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a la Lista
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 