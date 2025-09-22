import React from 'react';
import { FiAlertTriangle, FiMapPin, FiClock, FiPhone } from 'react-icons/fi';

const EmergencyAlerts = () => {
  const alerts = [
    {
      id: 1,
      type: 'high',
      title: 'Tourist Missing Report',
      description: 'John Smith not seen for 6 hours',
      location: 'Beach Resort Area',
      time: '30 minutes ago',
      contact: '+1 555 123 4567'
    },
    {
      id: 2,
      type: 'medium',
      title: 'Medical Assistance',
      description: 'Tourist requires medical help',
      location: 'Central Plaza',
      time: '1 hour ago',
      contact: '+34 987 654 321'
    },
    {
      id: 3,
      type: 'low',
      title: 'Lost Documents',
      description: 'Tourist lost passport and ID',
      location: 'Hotel District',
      time: '2 hours ago',
      contact: '+52 555 789 012'
    }
  ];

  const getAlertColor = (type) => {
    switch (type) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getAlertIconColor = (type) => {
    switch (type) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Emergency Alerts</h3>
        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
          {alerts.length} Active
        </span>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className={`p-4 border-l-4 rounded-lg ${getAlertColor(alert.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <FiAlertTriangle className={`w-5 h-5 mt-0.5 ${getAlertIconColor(alert.type)}`} />
                <div>
                  <h4 className="font-semibold text-gray-800">{alert.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{alert.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3" />
                      <span>{alert.location}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiClock className="w-3 h-3" />
                      <span>{alert.time}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button className="btn btn-primary text-xs px-3 py-1">
                Respond
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmergencyAlerts;
