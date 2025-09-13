import React from 'react';
import { FiTrendingUp, FiUsers, FiActivity, FiBarChart2 } from 'react-icons/fi';

const SystemAnalytics = () => {
  const analyticsData = [
    {
      title: 'User Growth',
      value: '23%',
      description: 'Monthly increase',
      icon: FiTrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Active Sessions',
      value: '342',
      description: 'Currently online',
      icon: FiActivity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'KYC Completion Rate',
      value: '87%',
      description: 'This month',
      icon: FiUsers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'System Performance',
      value: '99.2%',
      description: 'Uptime this month',
      icon: FiBarChart2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ];

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Analytics</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {analyticsData.map((item, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">{item.value}</div>
                <div className="text-xs text-gray-600">{item.title}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <FiBarChart2 className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Analytics Chart</p>
          <p className="text-xs">Real-time system metrics</p>
        </div>
      </div>
    </div>
  );
};

export default SystemAnalytics;
