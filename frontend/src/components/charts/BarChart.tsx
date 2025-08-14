'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import BaseChart from './BaseChart';

interface BarChartData {
  name: string;
  [key: string]: string | number;
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: BarChartData[];
  dataKeys: { key: string; name: string; color: string }[];
  loading?: boolean;
  error?: string;
  className?: string;
  actions?: React.ReactNode;
  xAxisKey?: string;
  height?: number;
  horizontal?: boolean;
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

export default function BarChart({
  title,
  subtitle,
  data,
  dataKeys,
  loading = false,
  error,
  className = '',
  actions,
  xAxisKey = 'name',
  height = 300,
  horizontal = false
}: BarChartProps) {
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
        <RechartsBarChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            className="stroke-gray-200 dark:stroke-gray-700" 
          />
          {horizontal ? (
            <>
              <XAxis type="number" className="text-gray-600 dark:text-gray-400" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey={xAxisKey}
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xAxisKey}
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
              <YAxis 
                className="text-gray-600 dark:text-gray-400"
                fontSize={12}
              />
            </>
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px'
            }}
          />
          {dataKeys.map((item, index) => (
            <Bar
              key={index}
              dataKey={item.key}
              name={item.name}
              fill={item.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </BaseChart>
  );
}