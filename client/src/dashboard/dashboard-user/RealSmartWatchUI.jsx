import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiActivity, FiZap, FiThermometer, FiClock, FiDroplet, FiWind, FiAlertTriangle, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

// Add scrollbar hiding styles
const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

const RealSmartWatchUI = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [watchData, setWatchData] = useState({
    heartRate: 72,
    steps: 8547,
    calories: 342,
    distance: 6.2,
    sleepHours: 7.5,
    bodyTemp: 98.6,
    stressLevel: 'Low',
    batteryLevel: 85,
    oxygen: 98,
    waterIntake: 6,
  });

  const [currentScreen, setCurrentScreen] = useState('home'); // home, heart, steps, activity, settings, fall
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [showFallAlert, setShowFallAlert] = useState(false);
  const [heartRateIncreasing, setHeartRateIncreasing] = useState(false);
  const [navScroll, setNavScroll] = useState(0);
  const [fallDetectionActive, setFallDetectionActive] = useState(false);
  const navContainerRef = useRef(null);
  const abnormalIntervalRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Heart rate increase effect
  useEffect(() => {
    if (heartRateIncreasing) {
      abnormalIntervalRef.current = setInterval(() => {
        setWatchData(prev => {
          const newRate = Math.min(prev.heartRate + 2, 150);
          if (newRate > 100) {
            setIsAbnormal(true);
          }
          return { ...prev, heartRate: newRate };
        });
      }, 200);

      return () => {
        if (abnormalIntervalRef.current) {
          clearInterval(abnormalIntervalRef.current);
        }
      };
    }
  }, [heartRateIncreasing]);

  const normalizeHeartRate = () => {
    const normalizeInterval = setInterval(() => {
      setWatchData(prev => {
        const newRate = Math.max(prev.heartRate - 2, 72);
        if (newRate <= 100) {
          setIsAbnormal(false);
        }
        if (newRate === 72) {
          clearInterval(normalizeInterval);
        }
        return { ...prev, heartRate: newRate };
      });
    }, 200);
  };

  // Get current user details
  const getCurrentUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      
      const response = await fetch(`${BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.user || null;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  };

  // Trigger SOS - Integrated with Dashboard SOS
  const triggerFallAlert = async () => {
    setShowFallAlert(true);
    setWatchData(prev => ({
      ...prev,
      heartRate: 140,
    }));

    try {
      // Get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            
            try {
              // Fetch user details
              const userDetails = await getCurrentUserDetails();
              console.log('👤 User details fetched from watch:', userDetails?.fullName);

              // Send SOS alert to police dashboard (same API as dashboard)
              const token = localStorage.getItem('token');
              const BASE_URL = import.meta.env.VITE_BASE_URL;

              const response = await fetch(`${BASE_URL}/api/emergency/sos-alert`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  location: {
                    latitude,
                    longitude,
                    accuracy
                  },
                  userDetails: userDetails,
                  timestamp: new Date().toISOString(),
                  source: 'smartwatch' // Identify as coming from smartwatch
                })
              });

              if (response.ok) {
                const result = await response.json();
                console.log('✅ SOS alert sent to police from watch:', result);
                toast.success('🚨 Emergency SOS triggered from watch! Police notified with your location.');
              } else {
                console.error('Failed to send SOS alert:', response.statusText);
                toast.error('Failed to send SOS alert to police');
              }
            } catch (error) {
              console.error('Error sending SOS alert from watch:', error);
              toast.error('Error sending SOS alert');
            }
          },
          (error) => {
            console.error('Location error:', error);
            toast.error('⚠️ Unable to get location. SOS triggered but location unavailable.');
          }
        );
      } else {
        toast.error('❌ Geolocation is not supported by this browser.');
      }
    } catch (error) {
      console.error('SOS Error:', error);
      toast.error('Error triggering SOS');
    }

    // Auto-close alert after 5 seconds
    setTimeout(() => {
      setShowFallAlert(false);
    }, 5000);
  };

  // Handle navigation scroll
  const handleNavScroll = (direction) => {
    if (navContainerRef.current) {
      const scrollAmount = 60;
      const newScroll = direction === 'left' 
        ? Math.max(0, navScroll - scrollAmount)
        : navScroll + scrollAmount;
      
      setNavScroll(newScroll);
      navContainerRef.current.scrollLeft = newScroll;
    }
  };

  // Handle touch swipe on navigation
  const handleTouchStart = useRef(null);
  const handleTouchMove = (e) => {
    if (!handleTouchStart.current) return;
    
    const touch = e.touches[0];
    const diff = handleTouchStart.current - touch.clientX;
    
    if (Math.abs(diff) > 10) {
      const newScroll = navScroll + diff;
      setNavScroll(Math.max(0, newScroll));
      if (navContainerRef.current) {
        navContainerRef.current.scrollLeft = Math.max(0, newScroll);
      }
    }
  };

  const handleTouchEnd = () => {
    handleTouchStart.current = null;
  };

  // Format time
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  // Home Screen
  const HomeScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-1 w-full">
      {/* Time Display */}
      <div className="text-center">
        <div className="text-3xl font-bold text-white mb-0.5">
          {hours}:{minutes}
        </div>
        <div className="text-xs text-gray-400">
          {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Heart Rate Ring */}
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="3" />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={watchData.heartRate > 100 ? '#ff4444' : '#4ade80'}
            strokeWidth="3"
            strokeDasharray={`${(watchData.heartRate / 150) * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs font-bold text-white">{watchData.heartRate}</div>
          <div className="text-xs text-gray-400">bpm</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-1 w-full px-1">
        <div className="bg-gray-800 rounded p-1 text-center">
          <div className="text-xs text-gray-400">Steps</div>
          <div className="text-xs font-bold text-white">{watchData.steps}</div>
        </div>
        <div className="bg-gray-800 rounded p-1 text-center">
          <div className="text-xs text-gray-400">Cal</div>
          <div className="text-xs font-bold text-white">{watchData.calories}</div>
        </div>
      </div>

      {/* PANIC Button */}
      <button
        onClick={triggerFallAlert}
        className={`w-12 h-12 rounded-full font-bold text-white text-xs transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center ${
          showFallAlert
            ? 'bg-red-700 animate-pulse'
            : 'bg-red-600 hover:bg-red-700 shadow-lg'
        }`}
        title="Emergency SOS"
      >
        🚨<br />SOS
      </button>
    </div>
  );

  // Heart Rate Screen
  const HeartRateScreen = () => (
    <div className="flex flex-col items-center justify-between h-full space-y-2 px-3 py-3">
      <div className="text-center">
        <FiHeart className="w-10 h-10 text-red-500 mx-auto mb-1" />
        <div className="text-2xl font-bold text-white">{watchData.heartRate}</div>
        <div className="text-xs text-gray-400">BPM</div>
      </div>

      <div className="w-full bg-gray-800 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Status</span>
          <span className={`text-xs font-semibold ${watchData.heartRate > 100 ? 'text-red-500' : 'text-green-500'}`}>
            {watchData.heartRate > 100 ? 'Elevated' : 'Normal'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Oxygen</span>
          <span className="text-xs font-semibold text-white">{watchData.oxygen}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Stress</span>
          <span className="text-xs font-semibold text-white">{watchData.stressLevel}</span>
        </div>
      </div>

      <div className="flex gap-2 w-full">
        <button
          onMouseDown={() => setHeartRateIncreasing(true)}
          onMouseUp={() => setHeartRateIncreasing(false)}
          onTouchStart={() => setHeartRateIncreasing(true)}
          onTouchEnd={() => setHeartRateIncreasing(false)}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-xs font-semibold"
        >
          Increase
        </button>
        <button
          onClick={normalizeHeartRate}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded-lg text-xs font-semibold"
        >
          Normalize
        </button>
      </div>
    </div>
  );

  // Steps Screen
  const StepsScreen = () => (
    <div className="flex flex-col items-center justify-between h-full space-y-2 px-3 py-3">
      <div className="text-center">
        <FiActivity className="w-10 h-10 text-blue-500 mx-auto mb-1" />
        <div className="text-2xl font-bold text-white">{watchData.steps}</div>
        <div className="text-xs text-gray-400">Steps</div>
      </div>

      {/* Progress Ring */}
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#333" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            strokeDasharray={`${(watchData.steps / 10000) * 283} 283`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs text-gray-400">{Math.round((watchData.steps / 10000) * 100)}%</div>
          <div className="text-xs text-gray-500">goal</div>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-lg p-2 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Distance</span>
          <span className="text-xs font-semibold text-white">{watchData.distance} km</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Calories</span>
          <span className="text-xs font-semibold text-white">{watchData.calories} kcal</span>
        </div>
      </div>
    </div>
  );

  // Activity Screen
  const ActivityScreen = () => (
    <div className="flex flex-col items-center justify-start h-full space-y-2 px-2 py-2 overflow-y-auto">
      <div className="text-center mb-2">
        <div className="text-lg font-bold text-white">Activity</div>
      </div>

      <div className="w-full space-y-2">
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <FiHeart className="w-4 h-4 text-red-500" />
              <span className="text-gray-400 text-xs">HR</span>
            </div>
            <span className="text-white font-semibold text-xs">{watchData.heartRate} bpm</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-red-500 h-1 rounded-full"
              style={{ width: `${(watchData.heartRate / 150) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <FiActivity className="w-4 h-4 text-blue-500" />
              <span className="text-gray-400 text-xs">Steps</span>
            </div>
            <span className="text-white font-semibold text-xs">{watchData.steps}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-blue-500 h-1 rounded-full"
              style={{ width: `${(watchData.steps / 10000) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <FiZap className="w-4 h-4 text-yellow-500" />
              <span className="text-gray-400 text-xs">Cal</span>
            </div>
            <span className="text-white font-semibold text-xs">{watchData.calories} kcal</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div
              className="bg-yellow-500 h-1 rounded-full"
              style={{ width: `${(watchData.calories / 500) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <FiThermometer className="w-4 h-4 text-orange-500" />
              <span className="text-gray-400 text-xs">Temp</span>
            </div>
            <span className="text-white font-semibold text-xs">{watchData.bodyTemp}°F</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Settings Screen
  const SettingsScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-2 px-3">
      <div className="text-center mb-2">
        <div className="text-lg font-bold text-white">Settings</div>
      </div>

      <div className="w-full space-y-1">
        <button
          onClick={triggerFallAlert}
          className={`w-full text-white py-2 rounded-lg font-semibold text-xs transition-all ${
            showFallAlert
              ? 'bg-red-700 animate-pulse'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          🚨 Emergency SOS
        </button>

        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold text-xs"
        >
          ⚙️ Settings
        </button>

        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold text-xs"
        >
          🔋 {watchData.batteryLevel}%
        </button>

        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold text-xs"
        >
          💧 {watchData.waterIntake}L
        </button>

        <button
          className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg font-semibold text-xs"
        >
          😴 {watchData.sleepHours}h
        </button>
      </div>
    </div>
  );

  // Fall Detection Screen
  const FallDetectionScreen = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-2 px-3">
      <div className="text-center mb-1">
        <div className="text-lg font-bold text-white">Fall Detection</div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-2">👤</div>
          <div className={`text-sm font-semibold transition-all ${
            fallDetectionActive ? 'text-red-400 animate-pulse' : 'text-green-400'
          }`}>
            {fallDetectionActive ? 'ACTIVE' : 'READY'}
          </div>
        </div>
      </div>

      <div className="w-full bg-gray-800 rounded-lg p-2 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Status</span>
          <span className={`text-xs font-semibold ${
            fallDetectionActive ? 'text-red-400' : 'text-green-400'
          }`}>
            {fallDetectionActive ? 'Detecting' : 'Standby'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Sensitivity</span>
          <span className="text-xs font-semibold text-white">High</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">Last Alert</span>
          <span className="text-xs font-semibold text-white">None</span>
        </div>
      </div>

      <div className="w-full space-y-1">
        <button
          onClick={() => setFallDetectionActive(!fallDetectionActive)}
          className={`w-full text-white py-2 rounded-lg font-semibold text-xs transition-all ${
            fallDetectionActive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {fallDetectionActive ? '⏹️ Disable' : '▶️ Enable'}
        </button>

        <button
          onClick={triggerFallAlert}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg font-semibold text-xs"
        >
          🧪 Test Alert
        </button>
      </div>
    </div>
  );

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'heart':
        return <HeartRateScreen />;
      case 'steps':
        return <StepsScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'fall':
        return <FallDetectionScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Scrollbar Hide Styles */}
      <style>{scrollbarHideStyle}</style>

      {/* Fall Alert Modal */}
      {showFallAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-red-600 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold text-white mb-2">FALL DETECTED</h2>
            <p className="text-red-100 mb-6">Emergency services have been notified</p>
            <div className="bg-red-700 rounded-lg p-4 mb-6 text-white text-sm">
              <p className="font-semibold">Heart Rate: {watchData.heartRate} BPM</p>
              <p className="text-red-100">Location: 30.7, 6</p>
            </div>
            <button
              onClick={() => setShowFallAlert(false)}
              className="w-full bg-white text-red-600 font-bold py-3 rounded-lg hover:bg-gray-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-500 rounded-full flex items-center justify-center">
              <FiClock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Real SmartWatch UI</h2>
              <p className="text-gray-600">Authentic smartwatch experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Display */}
      <div className="flex justify-center">
        <div className="relative w-80 h-96 bg-gradient-to-br from-gray-900 to-black rounded-full shadow-2xl border-8 border-gray-800 flex items-center justify-center overflow-visible">
          {/* Watch Screen */}
          <div className="absolute inset-4 bg-black rounded-full flex flex-col items-center justify-between p-3 overflow-hidden">
            {/* Top Status Bar */}
            <div className="w-full flex justify-between items-center text-xs text-gray-500 mb-1">
              <span>{watchData.batteryLevel}%</span>
              <span>📡</span>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
              {renderScreen()}
            </div>

            {/* Bottom Navigation - Scrollable */}
            <div className="w-full border-t border-gray-800 pt-0.5 pb-0.5">
              <div 
                ref={navContainerRef}
                className="flex items-center justify-center gap-0.5 overflow-x-auto scrollbar-hide"
                onTouchStart={(e) => { handleTouchStart.current = e.touches[0].clientX; }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ scrollBehavior: 'smooth' }}
              >
                <button
                  onClick={() => setCurrentScreen('home')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'home' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Home"
                >
                  🏠
                </button>
                <button
                  onClick={() => setCurrentScreen('heart')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'heart' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Heart"
                >
                  ❤️
                </button>
                <button
                  onClick={() => setCurrentScreen('steps')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'steps' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Steps"
                >
                  👟
                </button>
                <button
                  onClick={() => setCurrentScreen('activity')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'activity' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Activity"
                >
                  📊
                </button>
                <button
                  onClick={() => setCurrentScreen('settings')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'settings' ? 'bg-gray-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Settings"
                >
                  ⚙️
                </button>
                <button
                  onClick={() => setCurrentScreen('fall')}
                  className={`p-1 rounded transition-all text-xs flex-shrink-0 ${
                    currentScreen === 'fall' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}
                  title="Fall Detection"
                >
                  👤
                </button>
              </div>
            </div>
          </div>

          {/* Watch Crown (Right Side) */}
          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-4 h-12 bg-gray-700 rounded-r-lg shadow-lg" />
        </div>
      </div>

      {/* Control Panel */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Controls</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setCurrentScreen('home')}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🏠 Home
          </button>
          <button
            onClick={() => setCurrentScreen('heart')}
            className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
          >
            ❤️ Heart
          </button>
          <button
            onClick={() => setCurrentScreen('steps')}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            👟 Steps
          </button>
          <button
            onClick={() => setCurrentScreen('activity')}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
          >
            📊 Activity
          </button>
          <button
            onClick={() => setCurrentScreen('settings')}
            className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={triggerFallAlert}
            className="px-4 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 font-semibold"
          >
            🚨 SOS
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Features</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>✅ Circular smartwatch display</li>
          <li>✅ Real-time clock and date</li>
          <li>✅ Multiple screens (Home, Heart, Steps, Activity, Settings)</li>
          <li>✅ Heart rate monitoring with visual indicators</li>
          <li>✅ Activity tracking (steps, calories, distance)</li>
          <li>✅ Emergency SOS button</li>
          <li>✅ Fall detection alert</li>
          <li>✅ Realistic watch design with crown</li>
        </ul>
      </div>
    </div>
  );
};

export default RealSmartWatchUI;
