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

export const EVENT_STATUSES = [
  "activo",
  "cancelado",
  "completado",
  "borrador",
] as const;

export const RESERVATION_STATUSES = [
  "confirmada",
  "cancelada",
  "asistio",
  "no_asistio",
] as const;

export const USER_ROLES = [
  "user",
  "admin",
] as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/login",
    REGISTER: "/api/register",
    ME: "/api/me",
    REFRESH: "/api/refresh",
  },
  EVENTS: {
    LIST: "/api/events",
    CREATE: "/api/events",
    GET: (id: string) => `/api/events/${id}`,
    UPDATE: (id: string) => `/api/events/${id}`,
    DELETE: (id: string) => `/api/events/${id}`,
    CATEGORIES: "/api/categories",
  },
  RESERVATIONS: {
    LIST: "/api/reservations",
    CREATE: "/api/reservations",
    GET: (id: string) => `/api/reservations/${id}`,
    CANCEL: (id: string) => `/api/reservations/${id}/cancel`,
    CHECKIN: "/api/checkin",
  },
  ADMIN: {
    USERS: "/api/admin/users",
    STATS: "/api/admin/stats",
    REPORTS: "/api/admin/reports",
  },
} as const;

export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^(\+1)?[2-9]\d{2}[2-9]\d{2}\d{4}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
  },
  CEDULA: /^\d{3}-\d{7}-\d{1}$/,
} as const;

export const MESSAGES = {
  SUCCESS: {
    LOGIN: "Sesión iniciada correctamente",
    REGISTER: "Cuenta creada exitosamente",
    RESERVATION: "Reserva realizada con éxito",
    CHECKIN: "Check-in realizado correctamente",
    EVENT_CREATED: "Evento creado exitosamente",
    EVENT_UPDATED: "Evento actualizado correctamente",
    EVENT_DELETED: "Evento eliminado correctamente",
  },
  ERROR: {
    NETWORK: "Error de conexión. Intenta nuevamente.",
    UNAUTHORIZED: "No tienes permisos para realizar esta acción",
    VALIDATION: "Por favor verifica los datos ingresados",
    SERVER: "Error interno del servidor",
    NOT_FOUND: "Recurso no encontrado",
  },
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "theme",
  LANGUAGE: "language",
} as const;
