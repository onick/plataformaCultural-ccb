/**
 * Utilities for event management
 */

import type { EventCategory } from '@/types';

// Mapping between frontend (Spanish) and backend (English) categories
export const CATEGORY_MAPPING: Record<EventCategory, string> = {
  // Spanish to English (for API calls)
  'Cinema Dominicano': 'Dominican Cinema',
  'Cine Clásico': 'Classic Cinema',
  'Cine General': 'General Cinema',
  'Talleres': 'Workshops',
  'Conciertos': 'Concerts',
  'Charlas/Conferencias': 'Talks/Conferences',
  'Exposiciones de Arte': 'Art Exhibitions',
  'Experiencias 3D Inmersivas': '3D Immersive Experiences'
};

// English to Spanish (for display)
export const CATEGORY_MAPPING_REVERSE: Record<string, EventCategory> = {
  'Dominican Cinema': 'Cinema Dominicano',
  'Classic Cinema': 'Cine Clásico',
  'General Cinema': 'Cine General',
  'Workshops': 'Talleres',
  'Concerts': 'Conciertos',
  'Talks/Conferences': 'Charlas/Conferencias',
  'Art Exhibitions': 'Exposiciones de Arte',
  '3D Immersive Experiences': 'Experiencias 3D Inmersivas'
};

export const SPANISH_CATEGORIES: EventCategory[] = [
  'Cinema Dominicano',
  'Cine Clásico', 
  'Cine General',
  'Talleres',
  'Conciertos',
  'Charlas/Conferencias',
  'Exposiciones de Arte',
  'Experiencias 3D Inmersivas'
];

export const ENGLISH_CATEGORIES: string[] = [
  'Dominican Cinema',
  'Classic Cinema', 
  'General Cinema',
  'Workshops',
  'Concerts',
  'Talks/Conferences',
  'Art Exhibitions',
  '3D Immersive Experiences'
];

// Convert Spanish category to English for API
export function categoryToEnglish(spanishCategory: EventCategory | string): string {
  return CATEGORY_MAPPING[spanishCategory as EventCategory] || spanishCategory;
}

// Convert English category to Spanish for display
export function categoryToSpanish(englishCategory: string): EventCategory {
  return CATEGORY_MAPPING_REVERSE[englishCategory] || englishCategory as EventCategory;
}

// Format date for display
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-DO', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time for display
export function formatEventTime(timeString: string): string {
  return timeString; // Time is already in HH:mm format
}

// Get event status based on date
export function getEventStatus(eventDate: string): 'activo' | 'completado' {
  const today = new Date();
  const eventDateObj = new Date(eventDate);
  return eventDateObj < today ? 'completado' : 'activo';
}

// Calculate occupancy percentage
export function calculateOccupancy(capacity: number, availableSpots: number): number {
  const occupied = capacity - availableSpots;
  return (occupied / capacity) * 100;
}

// Get occupancy color class
export function getOccupancyColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600 bg-red-50';
  if (percentage >= 70) return 'text-orange-600 bg-orange-50';
  return 'text-green-600 bg-green-50';
}
