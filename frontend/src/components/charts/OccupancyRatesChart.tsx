"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OccupancyData {
  name: string;
  occupancy_rate: number;
  reservations: number;
  capacity: number;
  category: string;
}

interface OccupancyRatesChartProps {
  data: OccupancyData[];
  loading?: boolean;
}

export default function OccupancyRatesChart({ data, loading }: OccupancyRatesChartProps) {
  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ccb-blue"></div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          <div className="space-y-1 mt-2">
            <p className="text-sm">
              Categoría: <span className="font-medium">{data.category}</span>
            </p>
            <p className="text-sm">
              Reservas: <span className="font-medium">{data.reservations} / {data.capacity}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-ccb-blue rounded mr-2"></span>
              Ocupación: <span className="font-medium">{data.occupancy_rate}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (occupancy_rate: number) => {
    if (occupancy_rate >= 90) return '#22C55E'; // Verde - Excelente
    if (occupancy_rate >= 70) return '#0066CC'; // Azul CCB - Bueno
    if (occupancy_rate >= 50) return '#FFD700'; // Dorado CCB - Regular
    return '#EF4444'; // Rojo - Bajo
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            className="text-sm"
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            className="text-sm"
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            label={{ value: 'Ocupación (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="occupancy_rate" 
            fill="#003087"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.occupancy_rate)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
