"use client";

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyAttendanceData {
  month: string;
  checkins: number;
  reservations: number;
  attendance_rate: number;
}

interface MonthlyAttendanceChartProps {
  data: MonthlyAttendanceData[];
  loading?: boolean;
}

export default function MonthlyAttendanceChart({ data, loading }: MonthlyAttendanceChartProps) {
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
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-ccb-blue rounded mr-2"></span>
              Reservas: <span className="font-medium">{payload[0]?.value}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-ccb-lightblue rounded mr-2"></span>
              Check-ins: <span className="font-medium">{payload[1]?.value}</span>
            </p>
            <p className="text-sm">
              <span className="inline-block w-3 h-3 bg-ccb-gold rounded mr-2"></span>
              Tasa asistencia: <span className="font-medium">{payload[2]?.value}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="month" 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            className="text-sm"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="reservations" 
            stroke="#003087" 
            strokeWidth={3}
            dot={{ fill: '#003087', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#003087', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="checkins" 
            stroke="#0066CC" 
            strokeWidth={3}
            dot={{ fill: '#0066CC', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0066CC', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="attendance_rate" 
            stroke="#FFD700" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#FFD700', strokeWidth: 2, r: 3 }}
            activeDot={{ r: 5, stroke: '#FFD700', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
