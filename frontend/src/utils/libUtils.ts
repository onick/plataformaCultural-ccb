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

export const EVENT_CATEGORIES = [
  "Cinema Dominicano",
  "Cine Clásico",
  "Cine General",
  "Talleres",
  "Conciertos",
  "Charlas/Conferencias",
  "Exposiciones de Arte",
  "Experiencias 3D Inmersivas",
] as const; 