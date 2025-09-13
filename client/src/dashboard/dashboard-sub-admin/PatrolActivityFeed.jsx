import React from 'react';
import { FiMapPin, FiClock, FiUser, FiCheckCircle } from 'react-icons/fi';

const PatrolActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: 'verification',
      message: 'ID verified for John Doe',
      location: 'Central Plaza',
      time: '2 minutes ago',
      officer: 'Officer Smith',
      status: 'completed'
    },
    {
      id: 2,
      type: 'patrol',
      message: 'Patrol route completed',
      location: 'Tourist District',
      time: '15 minutes ago',
      officer: 'Officer Johnson',
      status: 'completed'
    },
    {
      id: 3,
      type: 'incident',
      message: 'Minor incident reported',
      location: 'Beach Area',
      time: '32 minutes ago',
      officer: 'Officer Davis',
      status: 'resolved'
    },
    {
      id: 4,
      type: 'verification',
      message: 'Tourist profile accessed',
      location: 'Hotel District',
      time: '1 hour ago',
      officer: 'Officer Wilson',
      status: 'completed'
    }
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'verification': return FiCheckCircle;
      case 'patrol': return FiMapPin;
      case 'incident': return FiUser;
      default: return FiClock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'verification': return 'text-green-600 bg-green-100';
      case 'patrol': return 'text-blue-600 bg-blue-100';
      case 'incident': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Patrol Activity Feed</h3>
      
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
                    <FiMapPin className="w-3 h-3" />
                    <span>{activity.location}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiUser className="w-3 h-3" />
                    <span>{activity.officer}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatrolActivityFeed;
