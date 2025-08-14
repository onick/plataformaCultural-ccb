"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users, Filter } from "lucide-react";
import { apiService } from "@/services/api";
import { Event } from "@/types";
import { formatDate, formatTime, getCategoryIcon } from "@/lib/utils";
import { categoryToSpanish } from "@/utils/eventUtils";
import Link from "next/link";
import { EVENT_CATEGORIES } from "@/lib/constants";

export function EventsGrid() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching events...');
      const eventsData = await apiService.getEvents();
      console.log('Events received:', eventsData);
      // Normalize categories to Spanish
      const normalizedEvents = eventsData.map(event => ({
        ...event,
        category: categoryToSpanish(event.category)
      }));
      console.log('Normalized events:', normalizedEvents);
      setEvents(normalizedEvents as Event[]);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure proper hydration
    const timer = setTimeout(() => {
      fetchEvents();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryFilter = (category: string) => {
    const newCategory = category === selectedCategory ? "" : category;
    setSelectedCategory(newCategory);
    // Filter events locally for now
    // In a real app, this would be handled by the API
  };

  // Filter events by category if selected
  const filteredEvents = selectedCategory 
    ? events.filter(event => event.category === selectedCategory)
    : events;
  
  const safeEvents = filteredEvents || [];

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Próximos Eventos
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Próximos Eventos
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Descubre nuestra programación cultural
          </p>
        </div>

        {/* Category Filters */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button
            variant={selectedCategory === "" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryFilter("")}
            className="flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Todas las categorías
          </Button>
          {EVENT_CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(category)}
              className="flex items-center"
            >
              <span className="mr-2">{getCategoryIcon(category)}</span>
              {category}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {safeEvents.length > 0 ? (
            safeEvents.slice(0, 6).map((event: Event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay eventos disponibles en este momento.</p>
              </div>
            </div>
          )}
        </div>

        {safeEvents.length > 6 && (
          <div className="mt-12 text-center">
            <Button size="lg" asChild>
              <Link href="/events">Ver todos los eventos</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function EventCard({ event }: { event: Event }) {
  const isAvailable = (event.available_spots || 0) > 0;
  const spotsLeft = event.available_spots || 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="relative overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-ccb-blue to-ccb-lightblue flex items-center justify-center">
            <span className="text-6xl">{getCategoryIcon(event.category)}</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-white/90 text-ccb-blue">
            {event.category}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge 
            variant={isAvailable ? "success" : "destructive"}
            className="bg-white/90"
          >
            {isAvailable ? `${spotsLeft} cupos` : "Agotado"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-lg group-hover:text-ccb-blue transition-colors">
          {event.title}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {event.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2 text-ccb-blue" />
          {formatDate(event.date)}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2 text-ccb-blue" />
          {event.time}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <MapPin className="w-4 h-4 mr-2 text-ccb-blue" />
          {event.location}
        </div>
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Users className="w-4 h-4 mr-2 text-ccb-blue" />
          {(event.capacity - (event.available_spots || 0))}/{event.capacity} asistentes
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button 
          className="w-full" 
          disabled={!isAvailable}
          asChild={isAvailable}
        >
          {isAvailable ? (
            <Link href={`/events/${event.id}`}>
              Reservar Evento
            </Link>
          ) : (
            "No disponible"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
