import React, { useState, useEffect } from 'react';
import { 
  FiUsers, 
  FiMapPin, 
  FiCheckCircle, 
  FiClock, 
  FiArrowRight,
  FiRefreshCw
} from 'react-icons/fi';

const ResponderWidget = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Mock responder data
  const mockResponders = [
    {
      id: 'RSP_001',
      name: 'Dr. Sarah Johnson',
      location: 'Downtown Medical Center',
      distance: '0.8 km',
      status: 'available',
      specialization: 'Emergency Medicine',
      responseTime: '3 min',
      rating: 4.9
    },
    {
      id: 'RSP_002',
      name: 'Officer Mike Chen',
      location: 'Central Police Station',
      distance: '1.2 km',
      status: 'available',
      specialization: 'Law Enforcement',
      responseTime: '5 min',
      rating: 4.8
    },
    {
      id: 'RSP_003',
      name: 'Paramedic Lisa Davis',
      location: 'Fire Station 12',
      distance: '2.1 km',
      status: 'busy',
      specialization: 'Emergency Medical',
      responseTime: '7 min',
      rating: 4.7
    },
    {
      id: 'RSP_004',
      name: 'Firefighter Tom Wilson',
      location: 'Fire Station 8',
      distance: '2.8 km',
      status: 'available',
      specialization: 'Fire & Rescue',
      responseTime: '8 min',
      rating: 4.9
    }
  ];

  useEffect(() => {
    setResponders(mockResponders);
  }, []);

  const refreshResponders = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResponders([...mockResponders]);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'busy':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return FiCheckCircle;
      case 'busy':
        return FiClock;
      default:
        return FiClock;
    }
  };

  const availableCount = responders.filter(r => r.status === 'available').length;
  const busyCount = responders.filter(r => r.status === 'busy').length;

  return (
    <div className="mb-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FiUsers className="text-purple-600 text-xl" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Responder Panel Preview</h2>
                <p className="text-sm text-gray-600">Nearby emergency responders</p>
              </div>
            </div>
            
            <button
              onClick={refreshResponders}
              disabled={loading}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 
                       rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-50"
            >
              <FiRefreshCw className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{availableCount}</p>
              <p className="text-sm text-gray-600">Available</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{busyCount}</p>
              <p className="text-sm text-gray-600">Busy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{responders.length}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </div>

        {/* Responders List */}
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {responders.map((responder) => {
            const StatusIcon = getStatusIcon(responder.status);
            
            return (
              <div key={responder.id} className="p-4 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {responder.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{responder.name}</h4>
                        <span className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${getStatusColor(responder.status)}
                        `}>
                          <StatusIcon className="mr-1 text-xs" />
                          {responder.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FiMapPin className="text-xs" />
                          <span>{responder.distance}</span>
                        </div>
                        <span>•</span>
                        <span>{responder.specialization}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>Response: {responder.responseTime}</span>
                        <span>•</span>
                        <span>Rating: ⭐ {responder.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    {responder.status === 'available' && (
                      <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Assign
                      </button>
                    )}
                    <span className="text-xs text-gray-500">{responder.location}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 
                           font-medium text-sm transition-colors duration-200">
            <span>View Full Responder Panel</span>
            <FiArrowRight />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <div>
              <p className="text-sm text-gray-600">Emergency Network</p>
              <p className="font-semibold text-green-600">Online & Ready</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex items-center space-x-3">
            <FiMapPin className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Coverage Radius</p>
              <p className="font-semibold text-gray-800">5 km active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderWidget;
