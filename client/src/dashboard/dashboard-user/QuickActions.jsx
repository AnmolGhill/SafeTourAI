import React, { useState } from 'react';
import { 
  FiAlertCircle, 
  FiMapPin, 
  FiMail, 
  FiPhone,
  FiLoader
} from 'react-icons/fi';

const QuickActions = () => {
  const [loading, setLoading] = useState({});
  const [location, setLocation] = useState(null);

  const handleEmergencySOS = async () => {
    setLoading(prev => ({ ...prev, sos: true }));
    
    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Simulate API call to backend
            console.log('Emergency SOS triggered:', { latitude, longitude });
            
            // Show success message
            alert('🚨 Emergency SOS has been triggered! Help is on the way.');
            
            setLoading(prev => ({ ...prev, sos: false }));
          },
          (error) => {
            console.error('Location error:', error);
            alert('⚠️ Emergency SOS triggered without location. Help is still on the way!');
            setLoading(prev => ({ ...prev, sos: false }));
          }
        );
      } else {
        alert('⚠️ Emergency SOS triggered. Help is on the way!');
        setLoading(prev => ({ ...prev, sos: false }));
      }
    } catch (error) {
      console.error('SOS Error:', error);
      setLoading(prev => ({ ...prev, sos: false }));
    }
  };

  const handleShareLocation = async () => {
    setLoading(prev => ({ ...prev, location: true }));
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          
          // Simulate API call
          console.log('Location shared:', { latitude, longitude });
          alert(`📍 Location shared successfully!\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`);
          
          setLoading(prev => ({ ...prev, location: false }));
        },
        (error) => {
          console.error('Location error:', error);
          alert('❌ Unable to get your location. Please check permissions.');
          setLoading(prev => ({ ...prev, location: false }));
        }
      );
    } else {
      alert('❌ Geolocation is not supported by this browser.');
      setLoading(prev => ({ ...prev, location: false }));
    }
  };

  const handleNotifyFamily = async () => {
    setLoading(prev => ({ ...prev, family: true }));
    
    try {
      // Simulate API call to notify family members
      console.log('Notifying family members...');
      
      setTimeout(() => {
        alert('📧 Family members have been notified of your status!');
        setLoading(prev => ({ ...prev, family: false }));
      }, 2000);
    } catch (error) {
      console.error('Notification error:', error);
      setLoading(prev => ({ ...prev, family: false }));
    }
  };

  const actions = [
    {
      id: 'sos',
      title: 'Trigger Emergency SOS',
      description: 'Send immediate distress signal',
      icon: FiAlertCircle,
      onClick: handleEmergencySOS,
      bgColor: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
      textColor: 'text-white',
      pulse: true
    },
    {
      id: 'location',
      title: 'Share Live Location',
      description: 'Share your current location',
      icon: FiMapPin,
      onClick: handleShareLocation,
      bgColor: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-white',
      pulse: false
    },
    {
      id: 'family',
      title: 'Notify Family Members',
      description: 'Send status update to contacts',
      icon: FiMail,
      onClick: handleNotifyFamily,
      bgColor: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-white',
      pulse: false
    }
  ];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Emergency Actions</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = loading[action.id];
          
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              disabled={isLoading}
              className={`
                ${action.bgColor} ${action.hoverColor} ${action.textColor}
                p-6 rounded-xl shadow-lg hover:shadow-xl
                transition-all duration-300 transform hover:-translate-y-1
                disabled:opacity-50 disabled:cursor-not-allowed
                ${action.pulse ? 'animate-pulse' : ''}
                group relative overflow-hidden
              `}
            >
              {/* Background Animation */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-4">
                  {isLoading ? (
                    <FiLoader className="text-4xl animate-spin" />
                  ) : (
                    <Icon className="text-4xl" />
                  )}
                </div>
                
                <h3 className="text-lg font-bold mb-2">{action.title}</h3>
                <p className="text-sm opacity-90">{action.description}</p>
                
                {isLoading && (
                  <div className="mt-3">
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Emergency Contacts Quick Access */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Emergency Contacts</h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <FiPhone className="text-blue-600" />
            <span className="text-sm text-gray-700">911</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <FiPhone className="text-green-600" />
            <span className="text-sm text-gray-700">Family</span>
          </button>
          <button className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
            <FiPhone className="text-purple-600" />
            <span className="text-sm text-gray-700">Medical</span>
          </button>
        </div>
      </div>

      {/* Current Location Display */}
      {location && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">Current Location</h4>
          <p className="text-sm text-blue-700">
            Latitude: {location.latitude.toFixed(6)}<br />
            Longitude: {location.longitude.toFixed(6)}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
