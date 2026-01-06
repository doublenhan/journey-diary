/**
 * Admin Charts Component - Data Visualizations
 */

import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Color palette
const COLORS = {
  primary: '#ec4899',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

interface UserGrowthChartProps {
  data: Array<{ date: string; users: number }>;
}

export const UserGrowthChart: React.FC<UserGrowthChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth Over Time</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="users" 
            stroke={COLORS.primary} 
            fillOpacity={1} 
            fill="url(#colorUsers)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface StorageUsageChartProps {
  data: Array<{ name: string; value: number }>;
}

export const StorageUsageBarChart: React.FC<StorageUsageChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage by Service</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
            formatter={(value: number | undefined) => value ? `${value.toFixed(2)} MB` : 'N/A'}
          />
          <Bar dataKey="value" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface ActivityMetricsProps {
  data: Array<{ date: string; memories: number; uploads: number }>;
}

export const ActivityMetricsChart: React.FC<ActivityMetricsProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="memories" 
            stroke={COLORS.primary} 
            strokeWidth={2}
            dot={{ fill: COLORS.primary }}
          />
          <Line 
            type="monotone" 
            dataKey="uploads" 
            stroke={COLORS.info} 
            strokeWidth={2}
            dot={{ fill: COLORS.info }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface UserStatusDistributionProps {
  data: Array<{ name: string; value: number }>;
}

export const UserStatusPieChart: React.FC<UserStatusDistributionProps> = ({ data }) => {
  const CHART_COLORS = [COLORS.success, COLORS.warning, COLORS.danger];
  
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(props) => {
              const { name, percent } = props;
              return `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
