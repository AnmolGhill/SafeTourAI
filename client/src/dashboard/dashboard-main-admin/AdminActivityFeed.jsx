import React from 'react';
import { FiUser, FiShield, FiDatabase, FiSettings, FiClock } from 'react-icons/fi';

const AdminActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: 'user_management',
      message: 'New user registered: Maria Garcia',
      time: '5 minutes ago',
      admin: 'System',
      status: 'completed'
    },
    {
      id: 2,
      type: 'kyc',
      message: 'KYC verification approved for John Doe',
      time: '12 minutes ago',
      admin: 'Admin Johnson',
      status: 'completed'
    },
    {
      id: 3,
      type: 'system',
      message: 'Database backup completed successfully',
      time: '1 hour ago',
      admin: 'System',
      status: 'completed'
    },
    {
      id: 4,
      type: 'security',
      message: 'Security scan initiated',
      time: '2 hours ago',
      admin: 'Admin Smith',
      status: 'completed'
    },
    {
      id: 5,
      type: 'settings',
      message: 'System settings updated',
      time: '3 hours ago',
      admin: 'Admin Johnson',
      status: 'completed'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_management': return FiUser;
      case 'kyc': return FiShield;
      case 'system': return FiDatabase;
      case 'security': return FiShield;
      case 'settings': return FiSettings;
      default: return FiClock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_management': return 'text-blue-600 bg-blue-100';
      case 'kyc': return 'text-green-600 bg-green-100';
      case 'system': return 'text-purple-600 bg-purple-100';
      case 'security': return 'text-red-600 bg-red-100';
      case 'settings': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Activity Feed</h3>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities.map((activity) => {
          const IconComponent = getActivityIcon(activity.type);
          return (
            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.message}</p>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <FiUser className="w-3 h-3" />
                    <span>{activity.admin}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiClock className="w-3 h-3" />
                    <span>{activity.time}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminActivityFeed;
