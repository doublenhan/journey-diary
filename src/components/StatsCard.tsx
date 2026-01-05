/**
 * Modern Stats Card Component with Icons, Gradients, and Animations
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  gradientFrom: string;
  gradientTo: string;
  iconBg?: string;
  subtitle?: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  gradientFrom,
  gradientTo,
  iconBg,
  subtitle,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            {subtitle && <div className="h-3 bg-gray-200 rounded w-20"></div>}
          </div>
          <div className={`w-16 h-16 rounded-xl bg-gray-200`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
      {/* Gradient background on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {/* Title */}
            <h3 className="text-sm font-medium text-gray-600 mb-2">
              {title}
            </h3>
            
            {/* Value with count-up animation */}
            <div className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">
              {value}
            </div>
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">
                {subtitle}
              </p>
            )}
            
            {/* Trend indicator */}
            {trend && (
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                trend.isPositive 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          
          {/* Icon */}
          <div className={`relative ${iconBg || `bg-gradient-to-br ${gradientFrom} ${gradientTo}`} w-16 h-16 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8 text-white" />
            
            {/* Animated glow effect */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300`}></div>
          </div>
        </div>
      </div>
      
      {/* Bottom accent line - show on hover */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
    </div>
  );
};

export default StatsCard;
