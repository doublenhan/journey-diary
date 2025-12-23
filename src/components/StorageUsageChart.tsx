/**
 * Storage Usage Chart Component
 */

import React from 'react';
import { Database, Image, HardDrive, Users, Zap, Edit } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface StorageUsageChartProps {
  used: number;
  limit: number;
  unit: string;
  label: string;
  icon: 'database' | 'image' | 'storage' | 'users' | 'zap' | 'edit';
  color: {
    from: string;
    to: string;
  };
}

const StorageUsageChart: React.FC<StorageUsageChartProps> = ({
  used,
  limit,
  unit,
  label,
  icon,
  color
}) => {
  const { t } = useLanguage();
  const percentage = Math.min((used / limit) * 100, 100);
  const remaining = Math.max(limit - used, 0);
  
  // Determine color based on usage
  const getBarColor = () => {
    if (percentage >= 90) return 'from-red-500 to-red-600';
    if (percentage >= 75) return 'from-orange-500 to-orange-600';
    if (percentage >= 50) return 'from-yellow-500 to-yellow-600';
    return `from-${color.from} to-${color.to}`;
  };

  const getIcon = () => {
    switch (icon) {
      case 'database':
        return <Database className="w-6 h-6 text-white" />;
      case 'image':
        return <Image className="w-6 h-6 text-white" />;
      case 'storage':
        return <HardDrive className="w-6 h-6 text-white" />;
      case 'users':
        return <Users className="w-6 h-6 text-white" />;
      case 'zap':
        return <Zap className="w-6 h-6 text-white" />;
      case 'edit':
        return <Edit className="w-6 h-6 text-white" />;
      default:
        return <Database className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 bg-gradient-to-br ${color.from} ${color.to} rounded-xl shadow-lg`}>
          {getIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
          <p className="text-sm text-gray-500">
            {used.toFixed(2)} / {limit} {unit}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${getBarColor()} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">{t('settings.admin.usage.used')}</p>
          <p className="font-semibold text-gray-800">{percentage.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500">{t('settings.admin.usage.remaining')}</p>
          <p className="font-semibold text-gray-800">
            {remaining.toFixed(2)} {unit}
          </p>
        </div>
      </div>

      {/* Warning Message */}
      {percentage >= 75 && (
        <div className={`mt-4 p-3 rounded-lg ${
          percentage >= 90 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-orange-50 border border-orange-200'
        }`}>
          <p className={`text-xs ${
            percentage >= 90 ? 'text-red-700' : 'text-orange-700'
          }`}>
            {percentage >= 90 
              ? t('settings.admin.warnings.critical')
              : t('settings.admin.warnings.high')}
          </p>
        </div>
      )}
    </div>
  );
};

export default StorageUsageChart;
