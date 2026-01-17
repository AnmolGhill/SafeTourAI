import React, { useState, useEffect } from 'react';
import { 
  FiMic, 
  FiMapPin, 
  FiPhone, 
  FiMail, 
  FiUser,
  FiClock,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiRefreshCw,
  FiEye,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const VoiceEmergencyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, resolved, terminated
  const [alertType, setAlertType] = useState('all'); // all, voice, sos
  const [policeNotes, setPoliceNotes] = useState('');
  const [isTerminating, setIsTerminating] = useState(false);

  // Fetch voice and SOS emergency alerts
  const fetchVoiceAlerts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_BASE_URL;

      // Fetch voice alerts
      const voiceResponse = await fetch(`${BASE_URL}/api/emergency/voice-alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Fetch SOS alerts
      const sosResponse = await fetch(`${BASE_URL}/api/emergency/sos-alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      let allAlerts = [];

      if (voiceResponse.ok) {
        const voiceResult = await voiceResponse.json();
        const voiceAlerts = (voiceResult.alerts || []).map(alert => ({
          ...alert,
          alertType: 'voice'
        }));
        allAlerts = [...allAlerts, ...voiceAlerts];
      }

      if (sosResponse.ok) {
        const sosResult = await sosResponse.json();
        const sosAlerts = (sosResult.alerts || []).map(alert => ({
          ...alert,
          alertType: 'sos'
        }));
        allAlerts = [...allAlerts, ...sosAlerts];
      }

      // Sort by timestamp (newest first)
      allAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAlerts(allAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load emergency alerts');
      // Set mock data for demo
      setAlerts(getMockAlerts());
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for demo
  const getMockAlerts = () => [
    {
      id: 'VOICE_1704067200000_user123',
      userId: 'user123',
      triggerWord: 'help',
      status: 'active',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        accuracy: 10
      },
      userDetails: {
        fullName: 'Sarah Johnson',
        email: 'sarah@example.com',
        phone: '+1-555-0123',
        age: 28,
        gender: 'Female',
        nationality: 'American',
        address: '123 Main St, New York, NY',
        bloodGroup: 'O+',
        emergencyContacts: [
          { name: 'John Johnson', phone: '+1-555-0124', relationship: 'Father' }
        ],
        medicalConditions: 'Asthma',
        allergies: 'Penicillin'
      }
    },
    {
      id: 'VOICE_1704066900000_user456',
      userId: 'user456',
      triggerWord: 'emergency',
      status: 'active',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      location: {
        latitude: 28.6129,
        longitude: 77.2100,
        accuracy: 15
      },
      userDetails: {
        fullName: 'Michael Chen',
        email: 'michael@example.com',
        phone: '+1-555-0125',
        age: 35,
        gender: 'Male',
        nationality: 'Chinese',
        address: '456 Oak Ave, New York, NY',
        bloodGroup: 'A+',
        emergencyContacts: [
          { name: 'Lisa Chen', phone: '+1-555-0126', relationship: 'Sister' }
        ],
        medicalConditions: 'Diabetes',
        allergies: 'None'
      }
    },
    {
      id: 'VOICE_1704066600000_user789',
      userId: 'user789',
      triggerWord: 'sos',
      status: 'resolved',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      location: {
        latitude: 28.6149,
        longitude: 77.2080,
        accuracy: 12
      },
      userDetails: {
        fullName: 'Emma Wilson',
        email: 'emma@example.com',
        phone: '+1-555-0127',
        age: 42,
        gender: 'Female',
        nationality: 'British',
        address: '789 Pine Rd, New York, NY',
        bloodGroup: 'B+',
        emergencyContacts: [
          { name: 'David Wilson', phone: '+1-555-0128', relationship: 'Spouse' }
        ],
        medicalConditions: 'Hypertension',
        allergies: 'Aspirin'
      }
    }
  ];

  useEffect(() => {
    fetchVoiceAlerts();
  }, []);

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    // Use userDetails from alert, fallback to mock data if not available
    setUserDetails(alert.userDetails || {
      fullName: 'Unknown User',
      email: 'N/A',
      phone: 'N/A',
      age: 'N/A',
      gender: 'N/A',
      nationality: 'N/A',
      address: 'N/A',
      bloodGroup: 'N/A',
      emergencyContacts: [],
      medicalConditions: 'N/A',
      allergies: 'N/A'
    });
    setShowDetailModal(true);
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const alert = alerts.find(a => a.id === alertId);
      const endpoint = alert?.alertType === 'sos' ? 'sos-alerts' : 'voice-alerts';

      const response = await fetch(`${BASE_URL}/api/emergency/${endpoint}/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }

      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'resolved' } : alert
      ));

      toast.success('Alert marked as resolved');
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const handleTerminateAlert = async (alertId) => {
    try {
      setIsTerminating(true);
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const alert = alerts.find(a => a.id === alertId);
      const endpoint = alert?.alertType === 'sos' ? 'sos-alerts' : 'voice-alerts';

      const response = await fetch(`${BASE_URL}/api/emergency/${endpoint}/${alertId}/terminate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ policeNotes: policeNotes })
      });

      if (!response.ok) {
        throw new Error('Failed to terminate alert');
      }

      // Update local state
      setAlerts(alerts.map(alert => 
        alert.id === alertId ? { ...alert, status: 'terminated' } : alert
      ));

      toast.success('Alert terminated and cleared from voice system');
      setShowDetailModal(false);
      setPoliceNotes('');
    } catch (error) {
      console.error('Error terminating alert:', error);
      toast.error('Failed to terminate alert');
    } finally {
      setIsTerminating(false);
    }
  };

  const getFilteredAlerts = () => {
    let filtered = alerts;

    // Filter by alert type
    if (alertType !== 'all') {
      filtered = filtered.filter(alert => alert.alertType === alertType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === filterStatus);
    }

    return filtered;
  };

  const filteredAlerts = getFilteredAlerts();

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'terminated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <FiAlertTriangle className="w-4 h-4" />;
      case 'resolved':
        return <FiCheckCircle className="w-4 h-4" />;
      case 'terminated':
        return <FiX className="w-4 h-4" />;
      default:
        return <FiClock className="w-4 h-4" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString();
  };

  const openMapLocation = (lat, lng) => {
    const mapsUrl = `https://maps.google.com/maps?q=${lat},${lng}`;
    window.open(mapsUrl, '_blank');
  };

  const getAlertTypeLabel = (type) => {
    if (type === 'voice') return 'Voice Alert';
    if (type === 'sos') return 'SOS Button';
    return 'Emergency Alert';
  };

  const getAlertTypeIcon = (type) => {
    if (type === 'sos') return <FiAlertCircle className="w-4 h-4" />;
    return <FiMic className="w-4 h-4" />;
  };

  const getAlertTypeColor = (type) => {
    if (type === 'sos') return 'bg-orange-100 text-orange-800';
    return 'bg-purple-100 text-purple-800';
  };

  if (isLoading) {
    return (
      <div className="card flex items-center justify-center py-12">
        <FiLoader className="w-8 h-8 animate-spin text-blue-600 mr-3" />
        <span className="text-gray-600">Loading voice emergency alerts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FiMic className="w-6 h-6 mr-2 text-red-600" />
            Emergency Alerts
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Monitor and respond to voice-triggered and SOS button emergency alerts from users
          </p>
        </div>
        <button
          onClick={fetchVoiceAlerts}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alert Type Filter Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'all', label: 'All Types', count: alerts.length },
          { id: 'voice', label: 'Voice Alerts', count: alerts.filter(a => a.alertType === 'voice').length },
          { id: 'sos', label: 'SOS Button', count: alerts.filter(a => a.alertType === 'sos').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setAlertType(tab.id)}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              alertType === tab.id
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label} <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'all', label: 'All Status', count: filteredAlerts.length },
          { id: 'active', label: 'Active', count: filteredAlerts.filter(a => a.status === 'active').length },
          { id: 'resolved', label: 'Resolved', count: filteredAlerts.filter(a => a.status === 'resolved').length },
          { id: 'terminated', label: 'Terminated', count: filteredAlerts.filter(a => a.status === 'terminated').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              filterStatus === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label} <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="card text-center py-12">
          <FiMic className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">No {filterStatus !== 'all' ? filterStatus : ''} voice emergency alerts</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Alert Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3 flex-wrap">
                    {/* Status Badge */}
                    <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(alert.status)}`}>
                      {getStatusIcon(alert.status)}
                      <span>{alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}</span>
                    </span>

                    {/* Alert Type Badge */}
                    <span className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getAlertTypeColor(alert.alertType)}`}>
                      {getAlertTypeIcon(alert.alertType)}
                      <span>{getAlertTypeLabel(alert.alertType)}</span>
                    </span>

                    {/* Trigger Word (only for voice alerts) */}
                    {alert.triggerWord && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        Trigger: "{alert.triggerWord}"
                      </span>
                    )}

                    {/* Time */}
                    <span className="text-gray-500 text-sm flex items-center">
                      <FiClock className="w-3 h-3 mr-1" />
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">User Name</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <FiUser className="w-3 h-3 mr-1" />
                        {alert.userDetails?.fullName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <FiPhone className="w-3 h-3 mr-1" />
                        {alert.userDetails?.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="font-semibold text-gray-800 flex items-center">
                        <FiMail className="w-3 h-3 mr-1" />
                        {alert.userDetails?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                      <button
                        onClick={() => openMapLocation(alert.location.latitude, alert.location.longitude)}
                        className="font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <FiMapPin className="w-3 h-3 mr-1" />
                        View Map
                      </button>
                    </div>
                  </div>

                  {/* Medical Info */}
                  {alert.userDetails?.medicalConditions && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-yellow-800 font-semibold">⚠️ Medical Alert</p>
                      <p className="text-sm text-yellow-900">
                        <strong>Conditions:</strong> {alert.userDetails.medicalConditions}
                        {alert.userDetails.allergies && ` | Allergies: ${alert.userDetails.allergies}`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(alert)}
                    className="flex items-center space-x-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>Details</span>
                  </button>

                  {alert.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleResolveAlert(alert.id)}
                        className="flex items-center space-x-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Resolve</span>
                      </button>
                      <button
                        onClick={() => handleViewDetails(alert)}
                        className="flex items-center space-x-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Confirm & Terminate</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAlert && userDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FiMic className="w-6 h-6" />
                <div>
                  <h3 className="text-xl font-bold">Emergency Alert Details</h3>
                  <p className="text-red-100 text-sm">ID: {selectedAlert.id}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-red-600 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Alert Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedAlert.status)}`}>
                      {getStatusIcon(selectedAlert.status)}
                      <span>{selectedAlert.status.charAt(0).toUpperCase() + selectedAlert.status.slice(1)}</span>
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trigger Word</p>
                    <p className="font-semibold text-gray-800">"{selectedAlert.triggerWord}"</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Time</p>
                    <p className="font-semibold text-gray-800">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location Accuracy</p>
                    <p className="font-semibold text-gray-800">±{selectedAlert.location.accuracy}m</p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">User Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Full Name</p>
                    <p className="font-semibold text-gray-800">{userDetails.fullName}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Age</p>
                    <p className="font-semibold text-gray-800">{userDetails.age} years</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Gender</p>
                    <p className="font-semibold text-gray-800">{userDetails.gender}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Nationality</p>
                    <p className="font-semibold text-gray-800">{userDetails.nationality}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Contact</p>
                    <p className="font-semibold text-gray-800">{userDetails.phone}</p>
                    <p className="font-semibold text-gray-800">{userDetails.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
                    <p className="font-semibold text-gray-800">{userDetails.address}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Medical Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-xs text-red-600 uppercase tracking-wide font-semibold mb-1">Blood Group</p>
                    <p className="font-bold text-red-800 text-lg">{userDetails.bloodGroup}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-xs text-yellow-600 uppercase tracking-wide font-semibold mb-1">Allergies</p>
                    <p className="font-semibold text-yellow-800">{userDetails.allergies || 'None'}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 col-span-2">
                    <p className="text-xs text-orange-600 uppercase tracking-wide font-semibold mb-1">Medical Conditions</p>
                    <p className="font-semibold text-orange-800">{userDetails.medicalConditions || 'None'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              {userDetails.emergencyContacts && userDetails.emergencyContacts.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-4">Emergency Contacts</h4>
                  <div className="space-y-2">
                    {userDetails.emergencyContacts.map((contact, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-800">{contact.name}</p>
                        <p className="text-sm text-gray-600">{contact.relationship}</p>
                        <p className="text-sm text-blue-600 font-medium">{contact.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Map */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Location</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Coordinates:</strong> {selectedAlert.location.latitude.toFixed(6)}, {selectedAlert.location.longitude.toFixed(6)}
                  </p>
                  <button
                    onClick={() => openMapLocation(selectedAlert.location.latitude, selectedAlert.location.longitude)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Open in Google Maps
                  </button>
                </div>
              </div>

              {/* Police Termination Section */}
              {selectedAlert.status === 'active' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-purple-800 mb-4">Police Confirmation & Termination</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Police Notes (Optional)
                      </label>
                      <textarea
                        value={policeNotes}
                        onChange={(e) => setPoliceNotes(e.target.value)}
                        placeholder="Enter any notes about this alert (e.g., false alarm, resolved, etc.)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows="3"
                      />
                    </div>
                    <p className="text-xs text-purple-700">
                      ℹ️ Once you confirm and terminate, this alert will be cleared from the voice system and the user's voice trigger will be reset.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                {selectedAlert.status === 'active' && (
                  <>
                    <button
                      onClick={() => {
                        handleResolveAlert(selectedAlert.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => handleTerminateAlert(selectedAlert.id)}
                      disabled={isTerminating}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isTerminating ? (
                        <>
                          <FiLoader className="w-4 h-4 mr-2 animate-spin" />
                          Terminating...
                        </>
                      ) : (
                        'Confirm & Terminate'
                      )}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceEmergencyAlerts;
