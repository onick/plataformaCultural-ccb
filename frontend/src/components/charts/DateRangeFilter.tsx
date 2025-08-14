'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface DateRange {
  startDate: string;
  endDate: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    value: DateRange;
  }>;
  className?: string;
}

const defaultPresets = [
  {
    label: 'Últimos 7 días',
    value: {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Últimos 30 días',
    value: {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Últimos 90 días',
    value: {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Este mes',
    value: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    }
  },
  {
    label: 'Mes pasado',
    value: {
      startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString().split('T')[0]
    }
  }
];

export default function DateRangeFilter({
  value,
  onChange,
  presets = defaultPresets,
  className = ''
}: DateRangeFilterProps) {
  const handlePresetSelect = (preset: DateRange) => {
    onChange(preset);
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const getCurrentPresetLabel = () => {
    const currentPreset = presets.find(preset => 
      preset.value.startDate === value.startDate && 
      preset.value.endDate === value.endDate
    );
    return currentPreset ? currentPreset.label : 'Personalizado';
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Preset Selector */}
      <div className="relative group">
        <button className="flex items-center justify-between w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]">
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {getCurrentPresetLabel()}
          </span>
          <ChevronDown className="w-4 h-4 ml-2" />
        </button>
        
        {/* Dropdown Menu */}
        <div className="absolute right-0 z-10 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="py-1">
            {presets.map((preset, index) => (
              <button
                key={index}
                onClick={() => handlePresetSelect(preset.value)}
                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                  getCurrentPresetLabel() === preset.label 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Inputs */}
      <div className="flex items-center space-x-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
              max={value.endDate}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
              min={value.startDate}
              max={new Date().toISOString().split('T')[0]}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}