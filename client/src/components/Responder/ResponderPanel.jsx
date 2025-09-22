import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
// emergencyService removed - using mock data
// usersAPI removed - using mock data
// socketService removed - using mock data
import { 
  UserGroupIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ResponderPanel = () => {
  const [nearbyEmergencies, setNearbyEmergencies] = useState([]);
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    getCurrentLocation();
    loadNearbyEmergencies();
    loadResponders();
    
    // Setup socket listeners
    socketService.on('emergency_alert', handleNewEmergency);
    socketService.on('responder_assigned', handleResponderAssigned);
    
    return () => {
      socketService.off('emergency_alert', handleNewEmergency);
      socketService.off('responder_assigned', handleResponderAssigned);
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await emergencyService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      toast.error('Failed to get current location');
    }
  };

  const loadNearbyEmergencies = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const data = await emergencyService.getNearbyEmergencies(
        userLocation.latitude,
        userLocation.longitude,
        10000 // 10km radius
      );
      setNearbyEmergencies(data);
    } catch (error) {
      toast.error('Failed to load nearby emergencies');
    } finally {
      setLoading(false);
    }
  };

  const loadResponders = async () => {
    if (!userLocation) return;
    
    try {
      const response = await usersAPI.getResponders({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius: 15000 // 15km radius
      });
      setResponders(response.data);
    } catch (error) {
      toast.error('Failed to load responders');
    }
  };

  const handleNewEmergency = (emergency) => {
    setNearbyEmergencies(prev => [emergency, ...prev]);
    toast.error(`New Emergency: ${emergency.type.toUpperCase()}`);
  };

  const handleResponderAssigned = (data) => {
    setNearbyEmergencies(prev =>
      prev.map(emergency =>
        emergency.emergencyId === data.emergencyId ? data : emergency
      )
    );
  };

  const handleAssignResponder = async (emergencyId, responderId) => {
    try {
      await emergencyService.assignResponder(emergencyId, responderId);
      toast.success('Responder assigned successfully');
      loadNearbyEmergencies();
    } catch (error) {
      toast.error('Failed to assign responder');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <UserGroupIcon className="h-8 w-8 text-blue-500 mr-3" />
          Responder Management
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Active Emergencies</h3>
            <p className="text-2xl font-bold text-blue-600">{nearbyEmergencies.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Available Responders</h3>
            <p className="text-2xl font-bold text-green-600">{responders.length}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Response Time</h3>
            <p className="text-2xl font-bold text-purple-600">4.2 min</p>
          </div>
        </div>
      </div>

      {/* Nearby Emergencies */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Nearby Emergencies</h3>
          <button
            onClick={loadNearbyEmergencies}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {nearbyEmergencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No nearby emergencies</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nearbyEmergencies.map((emergency) => (
              <div key={emergency.emergencyId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition duration-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      emergency.severity === 'critical' ? 'bg-red-500' :
                      emergency.severity === 'high' ? 'bg-orange-500' :
                      emergency.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {emergency.type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Severity: {emergency.severity} | Status: {emergency.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    {userLocation && emergency.location?.coordinates && (
                      <p className="flex items-center">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          emergency.location.coordinates[1],
                          emergency.location.coordinates[0]
                        )} km away
                      </p>
                    )}
                    <p className="flex items-center mt-1">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {new Date(emergency.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {emergency.description && (
                  <p className="text-gray-700 mb-3">{emergency.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p>User: {emergency.user?.name || 'Unknown'}</p>
                    <p>Phone: {emergency.user?.phone || 'N/A'}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    {emergency.status === 'active' && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignResponder(emergency.emergencyId, e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="px-3 py-1 border border-gray-300 rounded text-sm"
                        defaultValue=""
                      >
                        <option value="">Assign Responder</option>
                        {responders.map((responder) => (
                          <option key={responder.userId} value={responder.userId}>
                            {responder.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {emergency.responders && emergency.responders.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Assigned Responders:</p>
                    <div className="flex flex-wrap gap-2">
                      {emergency.responders.map((responder, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {responder.status} - {new Date(responder.respondedAt).toLocaleTimeString()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Responders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Available Responders</h3>
        
        {responders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No responders available nearby</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {responders.map((responder) => (
              <div key={responder.userId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {responder.name?.charAt(0) || 'R'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{responder.name}</h4>
                    <p className="text-sm text-gray-600">{responder.role}</p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p className="flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-2" />
                    {responder.phone}
                  </p>
                  {userLocation && responder.location?.coordinates && (
                    <p className="flex items-center">
                      <MapPinIcon className="h-4 w-4 mr-2" />
                      {calculateDistance(
                        userLocation.latitude,
                        userLocation.longitude,
                        responder.location.coordinates[1],
                        responder.location.coordinates[0]
                      )} km away
                    </p>
                  )}
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    responder.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {responder.isActive ? 'Available' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderPanel;
