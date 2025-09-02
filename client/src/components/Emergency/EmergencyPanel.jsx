import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/auth';
// emergencyService removed - using mock data for now
import { 
  FiAlertTriangle, 
  FiMapPin, 
  FiPhone, 
  FiClock, 
  FiUsers,
  FiSend,
  FiRefreshCw
} from 'react-icons/fi';

const EmergencyPanel = () => {
  const { user } = useAuth();
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [emergencyType, setEmergencyType] = useState('medical');
  const [description, setDescription] = useState('');
  const [isCreatingEmergency, setIsCreatingEmergency] = useState(false);

  useEffect(() => {
    fetchNearbyEmergencies();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchNearbyEmergencies = async () => {
    try {
      setLoading(true);
      // Mock data for emergencies
      const mockData = [
        {
          id: 1,
          type: 'Medical',
          description: 'Tourist injured at Main Square',
          location: 'Main Square, Downtown',
          status: 'active',
          priority: 'high',
          timestamp: new Date(Date.now() - 300000).toISOString()
        },
        {
          id: 2,
          type: 'Traffic',
          description: 'Road accident on Highway 101',
          location: 'Highway 101, Mile 15',
          status: 'responding',
          priority: 'medium',
          timestamp: new Date(Date.now() - 600000).toISOString()
        }
      ];
      setTimeout(() => {
        setEmergencies(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
      setEmergencies([]);
      setLoading(false);
    }
  };

  const handleCreateEmergency = async () => {
    if (!location) {
      alert('Location access is required to create an emergency alert');
      return;
    }

    try {
      setIsCreatingEmergency(true);
      // Mock emergency creation
      const newEmergency = {
        id: Date.now(),
        type: emergencyType,
        description,
        location,
        status: 'active',
        priority: 'high',
        timestamp: new Date().toISOString()
      };
      
      setTimeout(() => {
        setEmergencies(prev => [newEmergency, ...prev]);
        setEmergencyType('');
        setDescription('');
        setLocation('');
        setIsCreatingEmergency(false);
      }, 1000);
    } catch (error) {
      console.error('Error creating emergency:', error);
      setIsCreatingEmergency(false);
    } finally {
      setIsCreatingEmergency(false);
    }
  };

  const getEmergencyIcon = (type) => {
    switch (type) {
      case 'medical': return '🏥';
      case 'fire': return '🔥';
      case 'police': return '🚔';
      case 'accident': return '🚗';
      default: return '⚠️';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-red-600 bg-red-100';
      case 'responding': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FiAlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-800">Emergency Panel</h2>
        </div>
        <button
          onClick={fetchNearbyEmergencies}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Create Emergency Form */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Emergency Alert</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type
            </label>
            <select
              value={emergencyType}
              onChange={(e) => setEmergencyType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="medical">Medical Emergency</option>
              <option value="fire">Fire Emergency</option>
              <option value="police">Police Emergency</option>
              <option value="accident">Traffic Accident</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location Status
            </label>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <FiMapPin className={`w-4 h-4 ${location ? 'text-green-600' : 'text-red-600'}`} />
              <span className={`text-sm ${location ? 'text-green-600' : 'text-red-600'}`}>
                {location ? 'Location Acquired' : 'Location Required'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the emergency situation..."
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={handleCreateEmergency}
          disabled={isCreatingEmergency || !location || !description.trim()}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiSend className="w-4 h-4" />
          <span>{isCreatingEmergency ? 'Creating Alert...' : 'Create Emergency Alert'}</span>
        </button>
      </div>

      {/* Active Emergencies */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Nearby Emergencies</h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : emergencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiAlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No active emergencies in your area</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencies.map((emergency) => (
              <div key={emergency.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getEmergencyIcon(emergency.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-800 capitalize">
                          {emergency.type} Emergency
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(emergency.status)}`}>
                          {emergency.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">{emergency.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiMapPin className="w-4 h-4" />
                          <span>{emergency.distance || '0.5'} km away</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiClock className="w-4 h-4" />
                          <span>{emergency.timeAgo || '5 min ago'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FiUsers className="w-4 h-4" />
                          <span>{emergency.responders || 0} responders</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {emergency.status === 'active' && (
                    <button className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      <FiPhone className="w-4 h-4" />
                      <span>Respond</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyPanel;
