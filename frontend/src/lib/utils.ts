import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string' && date.includes('-') && date.length === 10) {
    // Format: YYYY-MM-DD
    const [year, month, day] = date.split('-');
    return new Intl.DateTimeFormat("es-DO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
  }
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatTime(time: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(`2000-01-01T${time}`));
}

export function formatDateTime(datetime: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(datetime));
}

export function generateReservationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function calculateEventDuration(startTime: string, endTime: string): string {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diff = end.getTime() - start.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

export function getEventStatusColor(status: string): string {
  switch (status) {
    case "activo":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20";
    case "cancelado":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20";
    case "completado":
      return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
    case "borrador":
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    default:
      return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
  }
}

export function getCategoryIcon(category: string): string {
  switch (category) {
    case "Cinema Dominicano":
    case "Cine Clásico":
    case "Cine General":
      return "🎬";
    case "Talleres":
      return "🎨";
    case "Conciertos":
      return "🎵";
    case "Charlas/Conferencias":
      return "🎤";
    case "Exposiciones de Arte":
      return "🖼️";
    case "Experiencias 3D Inmersivas":
      return "🥽";
    default:
      return "📅";
  }
}
