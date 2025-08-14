'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import BaseChart from './BaseChart';

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

interface LineChartProps {
  title: string;
  subtitle?: string;
  data: LineChartData[];
  dataKeys: { key: string; name: string; color: string }[];
  loading?: boolean;
  error?: string;
  className?: string;
  actions?: React.ReactNode;
  xAxisKey?: string;
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LineChart({
  title,
  subtitle,
  data,
  dataKeys,
  loading = false,
  error,
  className = '',
  actions,
  xAxisKey = 'name',
  height = 300
}: LineChartProps) {
  return (
    <BaseChart
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      className={className}
      actions={actions}
    >
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-gray-200 dark:stroke-gray-700" 
          />
          <XAxis 
            dataKey={xAxisKey}
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <YAxis 
            className="text-gray-600 dark:text-gray-400"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px'
            }}
          />
          {dataKeys.map((item, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={item.color}
              strokeWidth={2}
              dot={{ fill: item.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: item.color }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </BaseChart>
  );
}