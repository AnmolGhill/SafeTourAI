import React, { useState, useEffect } from 'react';
import { 
  FiBell, 
  FiMapPin, 
  FiLink, 
  FiAlertTriangle,
  FiCheckCircle,
  FiUser,
  FiClock,
  FiRefreshCw
} from 'react-icons/fi';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock activity data
  const mockActivities = [
    {
      id: 1,
      type: 'sos',
      title: 'Emergency SOS Triggered',
      description: 'John Doe triggered emergency SOS from Downtown Area',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      icon: FiAlertTriangle,
      color: 'red',
      priority: 'high'
    },
    {
      id: 2,
      type: 'location',
      title: 'Location Updated',
      description: 'Sarah Wilson shared live location with family',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      icon: FiMapPin,
      color: 'blue',
      priority: 'medium'
    },
    {
      id: 3,
      type: 'alert',
      title: 'Alert Sent to Family',
      description: 'Emergency notification sent to 3 family members',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      icon: FiBell,
      color: 'yellow',
      priority: 'medium'
    },
    {
      id: 4,
      type: 'blockchain',
      title: 'Blockchain Record Added',
      description: 'Emergency transaction recorded on blockchain',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      icon: FiLink,
      color: 'green',
      priority: 'low'
    },
    {
      id: 5,
      type: 'checkin',
      title: 'Safe Check-in',
      description: 'Mike Johnson checked in safe from Central Park',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      icon: FiCheckCircle,
      color: 'green',
      priority: 'low'
    },
    {
      id: 6,
      type: 'user',
      title: 'New User Registered',
      description: 'Emma Davis joined SafeTourAI network',
      timestamp: new Date(Date.now() - 90 * 60 * 1000),
      icon: FiUser,
      color: 'blue',
      priority: 'low'
    }
  ];

  useEffect(() => {
    setActivities(mockActivities);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: 'location',
        title: 'Location Updated',
        description: `User updated location at ${new Date().toLocaleTimeString()}`,
        timestamp: new Date(),
        icon: FiMapPin,
        color: 'blue',
        priority: 'medium'
      };
      
      setActivities(prev => [newActivity, ...prev.slice(0, 9)]);
    }, 60000); // Add new activity every minute

    return () => clearInterval(interval);
  }, []);

  const refreshFeed = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setActivities([...mockActivities]);
      setLoading(false);
    }, 1000);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getColorClasses = (color, priority) => {
    const baseClasses = {
      red: 'bg-red-50 border-red-200 text-red-800',
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      green: 'bg-green-50 border-green-200 text-green-800'
    };

    const iconClasses = {
      red: 'text-red-600 bg-red-100',
      blue: 'text-blue-600 bg-blue-100',
      yellow: 'text-yellow-600 bg-yellow-100',
      green: 'text-green-600 bg-green-100'
    };

    return {
      container: baseClasses[color] || baseClasses.blue,
      icon: iconClasses[color] || iconClasses.blue,
      pulse: priority === 'high' ? 'animate-pulse' : ''
    };
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Activity Feed</h2>
        <button
          onClick={refreshFeed}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 
                   rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50"
        >
          <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-gray-700">Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Live Updates</span>
            <span className="text-xs text-gray-500">({activities.length} events)</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-80">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiClock className="mx-auto text-3xl mb-2" />
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activities.map((activity) => {
                const Icon = activity.icon;
                const colorClasses = getColorClasses(activity.color, activity.priority);
                
                return (
                  <div
                    key={activity.id}
                    className={`p-4 hover:bg-gray-50 transition-colors duration-200 ${colorClasses.pulse}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`
                        p-2 rounded-lg ${colorClasses.icon} flex-shrink-0
                      `}>
                        <Icon className="text-lg" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-gray-800 truncate">
                            {activity.title}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {getTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`
                            inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                            ${colorClasses.container}
                          `}>
                            {activity.type.toUpperCase()}
                          </span>
                          
                          <span className="text-xs text-gray-400">
                            {activity.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
              View All Activities →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
