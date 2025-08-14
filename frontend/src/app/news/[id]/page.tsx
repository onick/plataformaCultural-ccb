'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Eye, 
  Tag, 
  Share2,
  Facebook,
  Twitter,
  Link as LinkIcon,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MainNav } from '@/components/layout/main-nav';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string;
  category: string;
  date: string;
  author: string;
  views: number;
  status: 'published' | 'draft' | 'archived';
}

interface NewsDetailPageProps {
  params: {
    id: string;
  };
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadArticle();
  }, [params.id]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar desde localStorage primero
      const savedNews = localStorage.getItem('ccb-news');
      let allArticles: {[key: string]: NewsArticle} = {};
      
      if (savedNews) {
        try {
          const newsArray = JSON.parse(savedNews);
          // Convertir array a objeto usando ID como key
          newsArray.forEach((news: any) => {
            allArticles[news.id] = news;
          });
        } catch (error) {
          console.error('Error parsing saved news:', error);
        }
      }
      
      // Si no hay datos guardados, usar datos de ejemplo
      if (Object.keys(allArticles).length === 0) {
        allArticles = {
        '1': {
          id: '1',
          title: 'Nueva Galería de Arte Digital Inmersiva',
          description: 'Experimenta el arte como nunca antes con nuestra nueva instalación de realidad virtual',
          content: `
          <p>El Centro Cultural Banreservas se complace en anunciar la apertura de su nueva Galería de Arte Digital Inmersiva, un espacio revolucionario que combina tecnología de vanguardia con expresiones artísticas contemporáneas.</p>

          <h2>Una Experiencia Única</h2>
          <p>Esta innovadora galería utiliza tecnología de realidad virtual y aumentada para crear experiencias artísticas inmersivas que transportan a los visitantes a mundos completamente nuevos. Los artistas pueden ahora expresar su creatividad de maneras antes inimaginables.</p>

          <h2>Tecnología de Vanguardia</h2>
          <p>La galería cuenta con:</p>
          <ul>
            <li>Proyectores 4K de última generación</li>
            <li>Sistemas de sonido envolvente</li>
            <li>Sensores de movimiento para interacción</li>
            <li>Plataformas de realidad virtual</li>
          </ul>

          <h2>Exhibición Inaugural</h2>
          <p>La exhibición inaugural "Mundos Digitales" presenta obras de 15 artistas dominicanos e internacionales que exploran temas como la identidad digital, la conectividad humana y el futuro de la expresión artística.</p>

          <p>Las visitas están disponibles de martes a domingo, de 10:00 AM a 6:00 PM. La entrada es gratuita para estudiantes y adultos mayores, y tiene un costo de RD$200 para el público general.</p>

          <p>Para más información y reservas, visite nuestro sitio web o llame al (809) 123-4567.</p>
          `,
          image_url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=1200&h=600&fit=crop',
          category: 'Arte Digital',
          date: '2024-01-15',
          author: 'CCB Admin',
          views: 234,
          status: 'published'
        },
        '2': {
          id: '2',
          title: 'Festival de Cinema Dominicano 2025',
          description: 'Celebramos nuestro patrimonio cinematográfico con 15 películas nacionales',
          content: `
          <p>El Centro Cultural Banreservas presenta la segunda edición del Festival de Cinema Dominicano, un evento que celebra la rica tradición cinematográfica de nuestro país y proyecta su futuro.</p>

          <h2>Programación</h2>
          <p>Durante una semana completa, del 1 al 7 de febrero, proyectaremos 15 películas que representan lo mejor del cine dominicano contemporáneo, desde documentales hasta largometrajes de ficción.</p>

          <h2>Películas Destacadas</h2>
          <ul>
            <li>"Nueba Yol 3: El Regreso" - Dirigida por Ángel Muñiz</li>
            <li>"Los Héroes de otra Historia" - Documental de Aurora Martínez</li>
            <li>"Caribeño" - Drama dirigido por Miguel Céspedes</li>
            <li>"La Soga 3" - Acción y suspenso de Josh Crook</li>
          </ul>

          <h2>Eventos Especiales</h2>
          <p>Además de las proyecciones, el festival incluye:</p>
          <ul>
            <li>Conversatorios con directores</li>
            <li>Talleres de guión y producción</li>
            <li>Mesa redonda sobre el futuro del cine dominicano</li>
            <li>Ceremonia de premiación</li>
          </ul>

          <p>La entrada es gratuita para todas las proyecciones, pero requiere reserva previa debido al aforo limitado.</p>
          `,
          image_url: 'https://images.unsplash.com/photo-1489599512406-ab09dfb9c2c1?w=1200&h=600&fit=crop',
          category: 'Cinema',
          date: '2024-01-10',
          author: 'CCB Admin',
          views: 456,
          status: 'published'
        },
        '3': {
          id: '3',
          title: 'Talleres Gratuitos para Jóvenes Artistas',
          description: 'Nuevos cupos disponibles en fotografía, música y artes visuales',
          content: `
          <p>El Centro Cultural Banreservas anuncia la apertura de inscripciones para sus talleres gratuitos dirigidos a jóvenes de 14 a 25 años interesados en desarrollar sus habilidades artísticas.</p>

          <h2>Talleres Disponibles</h2>
          
          <h3>Fotografía Digital</h3>
          <p>Aprende los fundamentos de la fotografía digital, composición, manejo de luz y edición básica. Incluye préstamo de equipo profesional.</p>
          <ul>
            <li>Duración: 8 semanas</li>
            <li>Horario: Sábados 9:00 AM - 12:00 PM</li>
            <li>Cupos: 15 estudiantes</li>
          </ul>

          <h3>Producción Musical</h3>
          <p>Introducción a la producción musical digital, grabación, mezcla y mastering usando software profesional.</p>
          <ul>
            <li>Duración: 10 semanas</li>
            <li>Horario: Miércoles 6:00 PM - 9:00 PM</li>
            <li>Cupos: 12 estudiantes</li>
          </ul>

          <h3>Artes Visuales</h3>
          <p>Explora diferentes técnicas de artes visuales incluyendo dibujo, pintura, escultura y arte digital.</p>
          <ul>
            <li>Duración: 6 semanas</li>
            <li>Horario: Viernes 4:00 PM - 7:00 PM</li>
            <li>Cupos: 20 estudiantes</li>
          </ul>

          <h2>Requisitos</h2>
          <ul>
            <li>Edad entre 14 y 25 años</li>
            <li>Llenar formulario de inscripción</li>
            <li>Carta de motivación (máximo 200 palabras)</li>
            <li>Compromiso de asistencia del 80%</li>
          </ul>

          <p>Las inscripciones están abiertas hasta el 31 de enero. Los talleres inician la primera semana de febrero.</p>
          `,
          image_url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1200&h=600&fit=crop',
          category: 'Educación',
          date: '2024-01-08',
          author: 'CCB Admin',
          views: 89,
          status: 'published'
        }
      };

      }
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular carga

      const articleData = allArticles[params.id];
      if (!articleData) {
        setError('Artículo no encontrado');
      } else {
        setArticle(articleData);
        // Incrementar vistas
        articleData.views += 1;
        
        // Cargar artículos relacionados
        const related = Object.values(allArticles)
          .filter((item: any) => 
            item.id !== params.id && // Excluir el artículo actual
            item.category === articleData.category && // Misma categoría
            item.status === 'published' // Solo publicados
          )
          .slice(0, 3); // Máximo 3 artículos
        
        setRelatedArticles(related as NewsArticle[]);
      }
    } catch (error) {
      console.error('Error loading article:', error);
      setError('Error al cargar el artículo');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = article?.title || '';
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        alert('Enlace copiado al portapapeles');
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-ccb-blue mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Cargando artículo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col">
        <MainNav />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Artículo no encontrado
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'El artículo que buscas no existe o ha sido eliminado.'}
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Link>
            </Button>
          </div>

          {/* Header Image */}
          <div className="relative h-96 rounded-xl overflow-hidden mb-8">
            <img 
              src={article.image_url} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <Badge className="bg-white/90 text-gray-800 mb-3">
                {article.category}
              </Badge>
              <h1 className="text-4xl font-bold text-white leading-tight">
                {article.title}
              </h1>
            </div>
          </div>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 mb-8 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(article.date).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              {article.author}
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              {article.views} vistas
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              5 min de lectura
            </div>
          </div>

          {/* Article Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {article.description}
                </div>
                <div 
                  dangerouslySetInnerHTML={{ __html: article.content }}
                  className="article-content"
                />
                
                {/* Estilos para el contenido del artículo */}
                <style jsx>{`
                  .article-content h1 {
                    font-size: 2.5rem;
                    font-weight: bold;
                    margin: 2rem 0 1rem 0;
                    line-height: 1.2;
                    color: #1f2937;
                  }
                  
                  .article-content h2 {
                    font-size: 2rem;
                    font-weight: bold;
                    margin: 1.5rem 0 0.75rem 0;
                    line-height: 1.3;
                    color: #1f2937;
                  }
                  
                  .article-content h3 {
                    font-size: 1.6rem;
                    font-weight: bold;
                    margin: 1.25rem 0 0.5rem 0;
                    line-height: 1.4;
                    color: #1f2937;
                  }
                  
                  .article-content h4 {
                    font-size: 1.3rem;
                    font-weight: bold;
                    margin: 1rem 0 0.5rem 0;
                    line-height: 1.4;
                    color: #1f2937;
                  }
                  
                  .article-content h5 {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin: 0.8rem 0 0.4rem 0;
                    line-height: 1.5;
                    color: #1f2937;
                  }
                  
                  .article-content h6 {
                    font-size: 1rem;
                    font-weight: bold;
                    margin: 0.6rem 0 0.3rem 0;
                    line-height: 1.5;
                    color: #1f2937;
                  }
                  
                  .article-content p {
                    margin: 1rem 0;
                    line-height: 1.8;
                    font-size: 1.1rem;
                    color: #374151;
                  }
                  
                  .article-content .ql-align-center {
                    text-align: center;
                  }
                  
                  .article-content .ql-align-right {
                    text-align: right;
                  }
                  
                  .article-content .ql-align-justify {
                    text-align: justify;
                    text-justify: inter-word;
                  }
                  
                  .article-content blockquote {
                    border-left: 4px solid #3b82f6;
                    padding-left: 1.5rem;
                    margin: 1.5rem 0;
                    font-style: italic;
                    background: #f8fafc;
                    padding: 1rem 1.5rem;
                    border-radius: 0 8px 8px 0;
                  }
                  
                  .article-content ul, .article-content ol {
                    margin: 1rem 0;
                    padding-left: 2rem;
                  }
                  
                  .article-content li {
                    margin: 0.5rem 0;
                    line-height: 1.6;
                  }
                  
                  .article-content strong {
                    font-weight: 600;
                    color: #1f2937;
                  }
                  
                  .article-content em {
                    font-style: italic;
                  }
                  
                  .article-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                  }
                  
                  .article-content a:hover {
                    color: #1d4ed8;
                  }
                  
                  .article-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 1.5rem 0;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  }
                  
                  /* Dark mode */
                  :global(.dark) .article-content h1,
                  :global(.dark) .article-content h2,
                  :global(.dark) .article-content h3,
                  :global(.dark) .article-content h4,
                  :global(.dark) .article-content h5,
                  :global(.dark) .article-content h6 {
                    color: #f9fafb;
                  }
                  
                  :global(.dark) .article-content p {
                    color: #d1d5db;
                  }
                  
                  :global(.dark) .article-content strong {
                    color: #f9fafb;
                  }
                  
                  :global(.dark) .article-content blockquote {
                    background: #1e293b;
                    border-left-color: #60a5fa;
                  }
                  
                  :global(.dark) .article-content a {
                    color: #60a5fa;
                  }
                  
                  :global(.dark) .article-content a:hover {
                    color: #93c5fd;
                  }
                                 `}</style>
                
                {/* Estilos adicionales para artículos relacionados */}
                <style jsx>{`
                  .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                  }
                `}</style>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Share */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => handleShare('facebook')}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Facebook
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => handleShare('twitter')}
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Twitter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={() => handleShare('copy')}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Copiar enlace
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Related Links */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Enlaces Relacionados</h3>
                    <div className="space-y-2 text-sm">
                      <Link href="/events" className="block text-ccb-blue hover:underline">
                        Ver todos los eventos
                      </Link>
                      <Link href="/auth/register" className="block text-ccb-blue hover:underline">
                        Únete a la comunidad
                      </Link>
                      <Link href="/news" className="block text-ccb-blue hover:underline">
                        Más noticias del CCB
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Artículos Relacionados */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Artículos Relacionados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Card key={relatedArticle.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={relatedArticle.image_url}
                        alt={relatedArticle.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <Badge
                        variant="secondary"
                        className="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs"
                      >
                        {relatedArticle.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">
                        {relatedArticle.title}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {relatedArticle.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(relatedArticle.date).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <Link
                          href={`/news/${relatedArticle.id}`}
                          className="text-ccb-blue hover:text-ccb-blue/80 text-sm font-medium transition-colors"
                        >
                          Leer más →
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </article>
      </main>
    </div>
  );
} 