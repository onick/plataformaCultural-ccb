"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeeklyTrendsData {
  day: string;
  date: string;
  new_users: number;
  new_reservations: number;
  checkins: number;
}

interface WeeklyTrendsChartProps {
  data: WeeklyTrendsData[];
  loading?: boolean;
}

export default function WeeklyTrendsChart({ data, loading }: WeeklyTrendsChartProps) {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <div className="space-y-1 mt-2">
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-sm">
                <span className="inline-block w-3 h-3 rounded mr-2" style={{ backgroundColor: entry.color }}></span>
                {entry.name === 'new_users' && 'Nuevos usuarios: '}
                {entry.name === 'new_reservations' && 'Nuevas reservas: '}
                {entry.name === 'checkins' && 'Check-ins: '}
                <span className="font-medium">{entry.value}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="new_users"
            stackId="1"
            stroke="#003087"
            fill="#003087"
            fillOpacity={0.6}
            name="Nuevos usuarios"
          />
          <Area
            type="monotone"
            dataKey="new_reservations"
            stackId="1"
            stroke="#0066CC"
            fill="#0066CC"
            fillOpacity={0.6}
            name="Nuevas reservas"
          />
          <Area
            type="monotone"
            dataKey="checkins"
            stackId="1"
            stroke="#FFD700"
            fill="#FFD700"
            fillOpacity={0.6}
            name="Check-ins"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
