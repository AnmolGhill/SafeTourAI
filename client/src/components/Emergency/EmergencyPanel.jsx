import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import emergencyService from '../../services/emergencyService';
import socketService from '../../services/socketService';
import { 
  ExclamationTriangleIcon, 
  MapPinIcon, 
  PhoneIcon,
  CameraIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const EmergencyPanel = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [selectedType, setSelectedType] = useState('medical');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadActiveEmergencies();
    
    // Setup socket listeners
    socketService.on('emergency_alert', handleEmergencyAlert);
    socketService.on('emergency_updated', handleEmergencyUpdate);
    
    return () => {
      socketService.off('emergency_alert', handleEmergencyAlert);
      socketService.off('emergency_updated', handleEmergencyUpdate);
    };
  }, []);

  const loadActiveEmergencies = async () => {
    setLoading(true);
    try {
      const data = await emergencyService.getActiveEmergencies();
      setEmergencies(data);
    } catch (error) {
      toast.error('Failed to load emergencies');
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyAlert = (data) => {
    setEmergencies(prev => [data, ...prev]);
    toast.error(`New Emergency Alert: ${data.type.toUpperCase()}`);
  };

  const handleEmergencyUpdate = (data) => {
    setEmergencies(prev => 
      prev.map(emergency => 
        emergency.emergencyId === data.emergencyId ? data : emergency
      )
    );
  };

  const handleQuickSOS = async () => {
    setSosLoading(true);
    try {
      const emergency = await emergencyService.quickSOS(selectedType, description);
      toast.success('Emergency SOS sent successfully!');
      setDescription('');
      loadActiveEmergencies();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSosLoading(false);
    }
  };

  const handleStatusUpdate = async (emergencyId, newStatus) => {
    try {
      await emergencyService.updateEmergencyStatus(emergencyId, newStatus);
      toast.success('Emergency status updated');
      loadActiveEmergencies();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'responded': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Quick SOS Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-3" />
          Emergency SOS
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="medical">Medical Emergency</option>
              <option value="accident">Accident</option>
              <option value="crime">Crime</option>
              <option value="fire">Fire</option>
              <option value="natural_disaster">Natural Disaster</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the emergency..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              rows="3"
            />
          </div>
        </div>

        <button
          onClick={handleQuickSOS}
          disabled={sosLoading}
          className={`w-full mt-6 py-4 px-6 rounded-lg font-bold text-lg transition duration-200 ${
            sosLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {sosLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Sending SOS...
            </div>
          ) : (
            'SEND EMERGENCY SOS'
          )}
        </button>
      </div>

      {/* Active Emergencies */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Active Emergencies</h3>
          <button
            onClick={loadActiveEmergencies}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {emergencies.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p>No active emergencies</p>
          </div>
        ) : (
          <div className="space-y-4">
            {emergencies.map((emergency) => (
              <div key={emergency.emergencyId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(emergency.severity)}`}></div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {emergency.type.replace('_', ' ').toUpperCase()}
                      </h4>
                      <p className="text-sm text-gray-600">ID: {emergency.emergencyId}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(emergency.status)}`}>
                    {emergency.status.toUpperCase()}
                  </span>
                </div>

                {emergency.description && (
                  <p className="text-gray-700 mb-3">{emergency.description}</p>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>{emergency.location?.address || 'Location unavailable'}</span>
                  </div>
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    <span>{new Date(emergency.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {emergency.responders && emergency.responders.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Responders:</p>
                    <div className="flex space-x-2">
                      {emergency.responders.map((responder, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {responder.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {emergency.status === 'active' && (
                    <button
                      onClick={() => handleStatusUpdate(emergency.emergencyId, 'responded')}
                      className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition duration-200"
                    >
                      Mark Responded
                    </button>
                  )}
                  {emergency.status === 'responded' && (
                    <button
                      onClick={() => handleStatusUpdate(emergency.emergencyId, 'resolved')}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition duration-200"
                    >
                      Mark Resolved
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
