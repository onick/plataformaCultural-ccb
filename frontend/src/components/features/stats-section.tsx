"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, MapPin, Star, Camera, Mic, Palette, Film } from "lucide-react";
import Link from "next/link";

interface SavedNews {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  status: string;
}

export function StatsSection() {
  const [recentNews, setRecentNews] = useState([
    {
      id: '1',
      title: "Nueva Galería de Arte Digital Inmersiva",
      description: "Experimenta el arte como nunca antes con nuestra nueva instalación de realidad virtual",
      date: "Hace 2 días",
      category: "Arte Digital",
      icon: Palette,
      image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop",
      urgent: true
    },
    {
      id: '2',
      title: "Festival de Cinema Dominicano 2025",
      description: "Celebramos nuestro patrimonio cinematográfico con 15 películas nacionales",
      date: "Hace 5 días", 
      category: "Cinema",
      icon: Film,
      image: "https://images.unsplash.com/photo-1489599512406-ab09dfb9c2c1?w=800&h=400&fit=crop"
    },
    {
      id: '3',
      title: "Talleres Gratuitos para Jóvenes Artistas",
      description: "Nuevos cupos disponibles en fotografía, música y artes visuales",
      date: "Hace 1 semana",
      category: "Educación",
      icon: Camera,
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=400&fit=crop"
    }
  ]);

  // Cargar noticias del localStorage después de la hidratación
  useEffect(() => {
    const loadNewsFromStorage = () => {
      try {
        const savedNews = localStorage.getItem('ccb-news');
        if (savedNews) {
          const allNews = JSON.parse(savedNews);
          const publishedNews = (allNews as SavedNews[])
            .filter(news => news.status === 'published')
            .slice(0, 3)
            .map((news, index) => ({
              id: news.id,
              title: news.title,
              description: news.description,
              date: "Reciente",
              category: news.category,
              icon: news.category === 'Arte Digital' ? Palette : 
                   news.category === 'Cinema' ? Film : Camera,
              image: news.image_url,
              urgent: index === 0
            }));
          
          if (publishedNews.length > 0) {
            setRecentNews(publishedNews);
          }
        }
      } catch (error) {
        console.error('Error loading news from localStorage:', error);
      }
    };

    loadNewsFromStorage();
  }, []);

  // Lo que está pasando ahora
  const currentActivities = [
    {
      title: "Exposición 'Voces del Caribe'",
      location: "Galería Principal",
      time: "Abierta todo el día",
      status: "en_curso",
      icon: "🖼️",
      participants: 47
    },
    {
      title: "Taller de Merengue Tradicional",
      location: "Aula de Danza",
      time: "3:00 PM - 5:00 PM",
      status: "proximo",
      icon: "💃",
      participants: 12
    },
    {
      title: "Cine Club: 'Nueba Yol'",
      location: "Sala de Cinema",
      time: "7:00 PM",
      status: "proximo",
      icon: "🎬",
      participants: 85
    },
    {
      title: "Concierto Acústico",
      location: "Terraza Cultural",
      time: "8:30 PM",
      status: "agotado",
      icon: "🎵",
      participants: 120
    }
  ];

  // Experiencias destacadas
  const experiences = [
    {
      title: "Conecta con Artistas Locales",
      description: "Conoce y colabora con más de 200 artistas de la comunidad",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      count: "200+"
    },
    {
      title: "Espacios Únicos",
      description: "7 espacios especializados para diferentes expresiones culturales",
      icon: MapPin,
      color: "text-green-600", 
      bgColor: "bg-green-100 dark:bg-green-900/20",
      count: "7"
    },
    {
      title: "Eventos Semanales",
      description: "Siempre hay algo nuevo que descubrir cada semana",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      count: "15+"
    },
    {
      title: "Experiencia Valorada",
      description: "Calificación promedio de nuestros visitantes",
      icon: Star,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      count: "4.8★"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_curso':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'proximo':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'agotado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en_curso':
        return 'En curso';
      case 'proximo':
        return 'Próximo';
      case 'agotado':
        return 'Agotado';
      default:
        return 'Programado';
    }
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Vive la Cultura
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Descubre las últimas noticias, actividades en tiempo real y experiencias únicas que te esperan en nuestro centro cultural
          </p>
        </div>

        {/* Noticias Recientes */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              📰 Últimas Noticias
            </h3>
            <Link 
              href="/events" 
              className="text-ccb-blue hover:text-ccb-blue/80 font-medium transition-colors"
            >
              Ver todas las noticias →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentNews.map((news, index) => {
              const Icon = news.icon;
              return (
                <Card key={index} className={`relative overflow-hidden hover:shadow-lg transition-shadow ${news.urgent ? 'ring-2 ring-ccb-gold' : ''}`}>
                  {news.urgent && (
                    <div className="absolute top-2 right-2 bg-ccb-gold text-ccb-blue px-3 py-1 text-xs font-bold rounded-lg z-10">
                      NUEVO
                    </div>
                  )}
                  
                  {/* Header Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <Badge 
                      variant="secondary" 
                      className="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs"
                    >
                      {news.category}
                    </Badge>
                  </div>
                  
                  <CardContent className="p-4">
                    <CardTitle className="text-lg leading-tight mb-2">
                      {news.title}
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
                      {news.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{news.date}</span>
                      <Link 
                        href={`/news/${news.id}`}
                        className="text-ccb-blue hover:text-ccb-blue/80 text-sm font-medium transition-colors"
                      >
                        Leer más →
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Lo que está pasando ahora */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎪 Sucediendo Ahora
            </h3>
            <Link 
              href="/events" 
              className="text-ccb-blue hover:text-ccb-blue/80 font-medium transition-colors"
            >
              Ver agenda completa →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {currentActivities.map((activity, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{activity.icon}</div>
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {getStatusText(activity.status)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">
                    {activity.title}
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {activity.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {activity.time}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {activity.participants} personas
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Experiencias que te esperan */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              ✨ Experiencias que te Esperan
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Únete a una comunidad vibrante de amantes del arte y la cultura
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiences.map((experience, index) => {
              const Icon = experience.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 ${experience.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <Icon className={`w-6 h-6 ${experience.color}`} />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {experience.count}
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {experience.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {experience.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-ccb-blue to-ccb-lightblue rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              ¿Listo para Vivir una Experiencia Cultural Única?
            </h3>
            <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">
              Explora nuestros eventos, únete a talleres, conecta con artistas y forma parte de la comunidad cultural más vibrante de la ciudad.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/events"
                className="inline-flex items-center px-6 py-3 bg-white text-ccb-blue rounded-lg hover:bg-gray-100 transition-colors font-semibold"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Explorar Eventos
              </Link>
              <Link 
                href="/auth/register"
                className="inline-flex items-center px-6 py-3 bg-ccb-gold text-ccb-blue rounded-lg hover:bg-ccb-gold/90 transition-colors font-semibold"
              >
                <Users className="w-5 h-5 mr-2" />
                Únete a la Comunidad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
