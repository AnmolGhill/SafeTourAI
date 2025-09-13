import React from 'react';
import { FiShield, FiLock, FiAlertTriangle, FiActivity } from 'react-icons/fi';

const SecurityPanel = () => {
  const securityMetrics = [
    {
      title: 'Security Level',
      status: 'Maximum',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: FiShield
    },
    {
      title: 'Failed Login Attempts',
      status: '3 (24h)',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      icon: FiLock
    },
    {
      title: 'Security Alerts',
      status: '0 Active',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      icon: FiAlertTriangle
    },
    {
      title: 'System Monitoring',
      status: 'Active',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: FiActivity
    }
  ];

  const recentSecurityEvents = [
    {
      id: 1,
      type: 'login',
      message: 'Admin login successful',
      time: '2 minutes ago',
      severity: 'info'
    },
    {
      id: 2,
      type: 'failed_login',
      message: 'Failed login attempt from IP 192.168.1.100',
      time: '15 minutes ago',
      severity: 'warning'
    },
    {
      id: 3,
      type: 'system',
      message: 'Security scan completed successfully',
      time: '1 hour ago',
      severity: 'info'
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Panel</h3>
      
      {/* Security Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {securityMetrics.map((metric, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 ${metric.bgColor} rounded flex items-center justify-center`}>
                <metric.icon className={`w-3 h-3 ${metric.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-700">{metric.title}</span>
            </div>
            <div className={`text-sm font-semibold ${metric.color}`}>{metric.status}</div>
          </div>
        ))}
      </div>

      {/* Recent Security Events */}
      <div>
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Recent Security Events</h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {recentSecurityEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity).split(' ')[1]}`}></span>
                <span className="text-gray-800">{event.message}</span>
              </div>
              <span className="text-gray-500">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;
