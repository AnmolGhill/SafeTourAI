import React from 'react';
import { FiCamera, FiSearch, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const QuickVerification = () => {
  const quickActions = [
    {
      title: 'Quick ID Scan',
      description: 'Scan tourist ID instantly',
      icon: FiCamera,
      color: 'bg-blue-500',
      action: 'scan'
    },
    {
      title: 'Profile Lookup',
      description: 'Search tourist database',
      icon: FiSearch,
      color: 'bg-green-500',
      action: 'search'
    },
    {
      title: 'Verify Status',
      description: 'Check verification status',
      icon: FiCheckCircle,
      color: 'bg-teal-500',
      action: 'verify'
    },
    {
      title: 'Report Issue',
      description: 'Flag suspicious activity',
      icon: FiAlertTriangle,
      color: 'bg-red-500',
      action: 'report'
    }
  ];

  return (
    <div className="card mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Verification</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <button
            key={index}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 text-sm">{action.title}</h4>
                <p className="text-xs text-gray-600">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickVerification;
