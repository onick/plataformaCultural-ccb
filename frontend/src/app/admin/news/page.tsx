'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Newspaper, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  Tag,
  Search,
  Filter,
  MoreHorizontal,
  MoreVertical,
  Clock,
  User
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

// Helper functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'draft':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'archived':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'published':
      return 'Publicado';
    case 'draft':
      return 'Borrador';
    case 'archived':
      return 'Archivado';
    default:
      return 'Desconocido';
  }
};

// Componente separado para cada item de noticia
function NewsListItem({ item, index, onDelete }: { 
  item: NewsItem; 
  index: number; 
  onDelete: (id: string) => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center space-x-4 flex-1">
        {/* Image Thumbnail */}
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
          {item.image_url ? (
            <img 
              src={item.image_url} 
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Newspaper className="w-6 h-6 text-gray-400" />
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {item.title}
            </h3>
            <Badge className={getStatusColor(item.status)}>
              {getStatusText(item.status)}
            </Badge>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {item.description}
          </p>
          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(item.date).toLocaleDateString('es-ES')}
            </span>
            <span className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {item.author}
            </span>
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {item.views} vistas
            </span>
            <span className="flex items-center">
              <Tag className="w-3 h-3 mr-1" />
              {item.category}
            </span>
          </div>
        </div>
      </div>
      
      {/* Dropdown Menu */}
      <div className="relative">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {isDropdownOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
              <div className="py-1">
                <Link 
                  href={`/news/${item.id}`}
                  target="_blank"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Eye className="w-4 h-4 mr-3 text-blue-500" />
                  Ver artículo público
                </Link>
                
                <Link 
                  href={`/admin/news/${item.id}/edit`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Edit className="w-4 h-4 mr-3 text-green-500" />
                  Editar noticia
                </Link>
                
                <div className="border-t border-gray-100 dark:border-gray-600 my-1" />
                
                <button 
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onDelete(item.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Eliminar noticia
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

export default function NewsManagementPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Datos de ejemplo iniciales
  const getInitialNews = (): NewsItem[] => {
    // Intentar cargar noticias del localStorage
    if (typeof window !== 'undefined') {
      const savedNews = localStorage.getItem('ccb-news');
      if (savedNews) {
        try {
          return JSON.parse(savedNews);
        } catch (error) {
          console.error('Error parsing saved news:', error);
        }
      }
    }
    
    // Si no hay datos guardados, usar datos de ejemplo
    return [
      {
        id: '1',
        title: 'Nueva Galería de Arte Digital Inmersiva',
        description: 'Experimenta el arte como nunca antes con nuestra nueva instalación de realidad virtual',
        content: '<p>El Centro Cultural Banreservas se complace en anunciar la apertura de su nueva <strong>Galería de Arte Digital Inmersiva</strong>, un espacio revolucionario que combina tecnología de vanguardia con expresiones artísticas contemporáneas.</p>',
        image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
        category: 'Arte Digital',
        date: '2024-01-15',
        status: 'published',
        author: 'CCB Admin',
        views: 234
      },
      {
        id: '2',
        title: 'Festival de Cinema Dominicano 2025',
        description: 'Celebramos nuestro patrimonio cinematográfico con 15 películas nacionales',
        content: '<p>El Centro Cultural Banreservas presenta la segunda edición del Festival de Cinema Dominicano, un evento que celebra la rica tradición cinematográfica de nuestro país y proyecta su futuro.</p>',
        image_url: 'https://images.unsplash.com/photo-1489599512406-ab09dfb9c2c1?w=800&h=400&fit=crop',
        category: 'Cinema',
        date: '2024-01-10',
        status: 'published',
        author: 'CCB Admin',
        views: 456
      },
      {
        id: '3',
        title: 'Talleres Gratuitos para Jóvenes Artistas',
        description: 'Nuevos cupos disponibles en fotografía, música y artes visuales',
        content: '<p>El Centro Cultural Banreservas anuncia la apertura de inscripciones para sus talleres gratuitos dirigidos a jóvenes de 14 a 25 años interesados en desarrollar sus habilidades artísticas.</p>',
        image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop',
        category: 'Educación',
        date: '2024-01-08',
        status: 'draft',
        author: 'CCB Admin',
        views: 89
      },
      {
        id: '4',
        title: 'Exposición de Fotografía Urbana',
        description: 'Artistas locales capturan la esencia de Santo Domingo',
        content: '<p>Una nueva exposición de fotografía urbana abre sus puertas en el Centro Cultural Banreservas, presentando la obra de talentosos artistas locales que han capturado la esencia vibrante de Santo Domingo.</p>',
        image_url: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=400&fit=crop',
        category: 'Fotografía',
        date: '2024-01-05',
        status: 'archived',
        author: 'CCB Admin',
        views: 123
      }
    ];
  };

  // Cargar noticias al montar el componente
  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      const initialNews = getInitialNews();
      setNews(initialNews);
      setLoading(false);
    }, 1000);
  }, []);

  // Función para guardar noticias en localStorage
  const saveNewsToStorage = (newsData: NewsItem[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ccb-news', JSON.stringify(newsData));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado';
      case 'draft':
        return 'Borrador';
      case 'archived':
        return 'Archivado';
      default:
        return 'Desconocido';
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      const updatedNews = news.filter(item => item.id !== id);
      setNews(updatedNews);
      saveNewsToStorage(updatedNews);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Noticias
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Administra las noticias y artículos del centro cultural
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button asChild className="bg-ccb-blue hover:bg-ccb-blue/90">
            <Link href="/admin/news/create">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Noticia
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Noticias</p>
                <p className="text-2xl font-bold">{news.length}</p>
              </div>
              <Newspaper className="w-8 h-8 text-ccb-blue" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Publicadas</p>
                <p className="text-2xl font-bold">{news.filter(n => n.status === 'published').length}</p>
              </div>
              <Eye className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Borradores</p>
                <p className="text-2xl font-bold">{news.filter(n => n.status === 'draft').length}</p>
              </div>
              <Edit className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Vistas</p>
                <p className="text-2xl font-bold">{news.reduce((acc, n) => acc + n.views, 0)}</p>
              </div>
              <Eye className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="archived">Archivado</option>
            </select>
            
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-ccb-blue dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todas las categorías</option>
              <option value="Arte Digital">Arte Digital</option>
              <option value="Cinema">Cinema</option>
              <option value="Educación">Educación</option>
              <option value="Fotografía">Fotografía</option>
              <option value="Música">Música</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* News List */}
      <Card>
        <CardHeader>
          <CardTitle>Noticias ({filteredNews.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNews.length > 0 ? (
            <div className="space-y-4">
              {filteredNews.map((item, index) => (
                <NewsListItem
                  key={item.id}
                  item={item}
                  index={index}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay noticias
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'No se encontraron noticias con los filtros seleccionados.' 
                  : 'Aún no has creado ninguna noticia.'
                }
              </p>
              <Button asChild className="bg-ccb-blue hover:bg-ccb-blue/90">
                <Link href="/admin/news/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Noticia
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 