"use client";

import React from 'react';
import EventCalendar from '@/components/calendar/EventCalendar';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendario de Eventos
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Vista mensual de todos los eventos del Centro Cultural Banreservas
          </p>
        </div>
      </div>

      <EventCalendar />
    </div>
  );
}