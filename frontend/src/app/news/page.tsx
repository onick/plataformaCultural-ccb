'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, Tag, Eye, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MainNav } from '@/components/layout/main-nav';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Cargar noticias desde localStorage o datos mock
  useEffect(() => {
    const loadNews = () => {
      try {
        setLoading(true);
        
        let allNews: NewsItem[] = [];
        
        // Intentar cargar desde localStorage
        const savedNews = localStorage.getItem('ccb-news');
        if (savedNews) {
          try {
            allNews = JSON.parse(savedNews);
          } catch (error) {
            console.error('Error parsing saved news:', error);
          }
        }
        
        // Si no hay noticias guardadas, usar datos mock
        if (allNews.length === 0) {
          allNews = [
            {
              id: '1',
              title: 'Nueva Galería de Arte Digital Inmersiva',
              description: 'Experimenta el arte como nunca antes con nuestra nueva instalación de realidad virtual',
              content: 'Contenido completo del artículo...',
              image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
              category: 'Arte Digital',
              date: '2024-01-15',
              status: 'published' as const,
              author: 'CCB Admin',
              views: 234
            },
            {
              id: '2',
              title: 'Festival de Cinema Dominicano 2025',
              description: 'Celebramos nuestro patrimonio cinematográfico con 15 películas nacionales',
              content: 'Contenido completo del artículo...',
              image_url: 'https://images.unsplash.com/photo-1489599735788-c1bc92a3c6e7?w=800&h=400&fit=crop',
              category: 'Cinema',
              date: '2024-01-10',
              status: 'published' as const,
              author: 'CCB Admin',
              views: 156
            },
            {
              id: '3',
              title: 'Talleres Gratuitos para Jóvenes Artistas',
              description: 'Programa educativo completo con certificación oficial',
              content: 'Contenido completo del artículo...',
              image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop',
              category: 'Educación',
              date: '2024-01-08',
              status: 'published' as const,
              author: 'CCB Admin',
              views: 89
            }
          ];
        }
        
        // Filtrar solo noticias publicadas
        const publishedNews = allNews.filter(item => item.status === 'published');
        setNews(publishedNews);
        setFilteredNews(publishedNews);
        
      } catch (error) {
        console.error('Error loading news:', error);
      } finally {
        setTimeout(() => setLoading(false), 800);
      }
    };

    loadNews();
  }, []);

  // Filtrar noticias según búsqueda y categoría
  useEffect(() => {
    let filtered = news;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredNews(filtered);
  }, [news, searchTerm, selectedCategory]);

  // Obtener categorías únicas
  const categories = ['all', ...Array.from(new Set(news.map(item => item.category)))];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ccb-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando noticias...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <MainNav />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-ccb-blue to-ccb-blue/80 py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Noticias CCB
            </motion.h1>
            <motion.p 
              className="text-xl text-white/90 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Mantente al día con todas las novedades, eventos y actividades del Centro Cultural
            </motion.p>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="py-8 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccb-blue focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-ccb-blue focus:border-transparent"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'Todas las categorías' : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* News Grid */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {filteredNews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Tag className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No se encontraron noticias
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Aún no hay noticias publicadas'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredNews.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <Badge
                          variant="secondary"
                          className="absolute bottom-3 left-3 bg-white/90 text-gray-800"
                        >
                          {item.category}
                        </Badge>
                      </div>
                      <CardContent className="p-6">
                        <CardTitle className="text-xl leading-tight mb-3 line-clamp-2">
                          {item.title}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(item.date).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center">
                            <Eye className="w-4 h-4 mr-1" />
                            {item.views}
                          </div>
                        </div>
                        
                        <Link href={`/news/${item.id}`}>
                          <Button className="w-full bg-ccb-blue hover:bg-ccb-blue/90 text-white">
                            Leer artículo completo
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
} 