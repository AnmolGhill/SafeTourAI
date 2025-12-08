import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiActivity, FiZap, FiThermometer, FiClock, FiMoon, FiTrendingUp, FiRotateCw, FiPlus, FiMinus, FiAlertTriangle, FiMove } from 'react-icons/fi';

const VirtualSmartWatchSimulator = () => {
  const canvasRef = useRef(null);
  const watchContainerRef = useRef(null);
  const [watchData, setWatchData] = useState({
    heartRate: 72,
    steps: 8547,
    calories: 342,
    distance: 6.2,
    sleepHours: 7.5,
    bodyTemp: 98.6,
    stressLevel: 'Low',
    batteryLevel: 85,
    time: new Date(),
    watchId: 'Watch #101',
    lastLocation: '30.7, 6',
  });

  const [isAbnormal, setIsAbnormal] = useState(false);
  const [heartRateIncreasing, setHeartRateIncreasing] = useState(false);
  const [abnormalDuration, setAbnormalDuration] = useState(0);
  const [displayMode, setDisplayMode] = useState('watch'); // 'watch' or 'stats'
  const [showFallAnimation, setShowFallAnimation] = useState(false);
  const [watchPosition, setWatchPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const abnormalIntervalRef = useRef(null);
  const normalizeTimeoutRef = useRef(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setWatchData(prev => ({
        ...prev,
        time: new Date()
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle abnormal heart rate increase
  useEffect(() => {
    if (heartRateIncreasing) {
      abnormalIntervalRef.current = setInterval(() => {
        setWatchData(prev => {
          const newRate = Math.min(prev.heartRate + 2, 150);
          return { ...prev, heartRate: newRate };
        });
      }, 200);

      setIsAbnormal(true);
      setAbnormalDuration(0);

      return () => {
        if (abnormalIntervalRef.current) {
          clearInterval(abnormalIntervalRef.current);
        }
      };
    }
  }, [heartRateIncreasing]);

  // Track abnormal duration and normalize after stopping
  useEffect(() => {
    if (isAbnormal && !heartRateIncreasing) {
      const timer = setInterval(() => {
        setAbnormalDuration(prev => prev + 1);
      }, 1000);

      // Auto-normalize after 30 seconds of not clicking
      normalizeTimeoutRef.current = setTimeout(() => {
        normalizeHeartRate();
      }, 30000);

      return () => {
        clearInterval(timer);
        if (normalizeTimeoutRef.current) {
          clearTimeout(normalizeTimeoutRef.current);
        }
      };
    }
  }, [isAbnormal, heartRateIncreasing]);

  const increaseHeartRate = () => {
    setHeartRateIncreasing(true);
  };

  const stopIncreasing = () => {
    setHeartRateIncreasing(false);
  };

  const normalizeHeartRate = () => {
    if (normalizeTimeoutRef.current) {
      clearTimeout(normalizeTimeoutRef.current);
    }
    
    const normalizeInterval = setInterval(() => {
      setWatchData(prev => {
        const newRate = Math.max(prev.heartRate - 2, 72);
        if (newRate === 72) {
          clearInterval(normalizeInterval);
          setIsAbnormal(false);
          setAbnormalDuration(0);
        }
        return { ...prev, heartRate: newRate };
      });
    }, 200);
  };

  const resetSimulation = () => {
    if (abnormalIntervalRef.current) {
      clearInterval(abnormalIntervalRef.current);
    }
    if (normalizeTimeoutRef.current) {
      clearTimeout(normalizeTimeoutRef.current);
    }
    setHeartRateIncreasing(false);
    setIsAbnormal(false);
    setAbnormalDuration(0);
    setWatchData(prev => ({
      ...prev,
      heartRate: 72,
      steps: 8547,
      calories: 342,
      distance: 6.2,
    }));
  };

  // Handle fall detection animation
  const triggerFallDetection = () => {
    setShowFallAnimation(true);
    // Simulate emergency alert
    setIsAbnormal(true);
    setWatchData(prev => ({
      ...prev,
      heartRate: 140,
      stressLevel: 'Critical'
    }));
    
    // Auto-hide animation after 5 seconds
    setTimeout(() => {
      setShowFallAnimation(false);
    }, 5000);
  };

  // Handle watch dragging
  const handleMouseDown = (e) => {
    if (watchContainerRef.current) {
      setIsDragging(true);
      const rect = watchContainerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && watchContainerRef.current) {
      const parent = watchContainerRef.current.parentElement;
      const parentRect = parent.getBoundingClientRect();
      
      setWatchPosition({
        x: e.clientX - parentRect.left - dragOffset.x,
        y: e.clientY - parentRect.top - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Draw smartwatch face
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 140;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw watch bezel (outer circle)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Draw watch face (inner circle)
    ctx.fillStyle = '#0f0f0f';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw watch border
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw time
    const hours = String(watchData.time.getHours()).padStart(2, '0');
    const minutes = String(watchData.time.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeString, centerX, centerY - 30);

    // Draw heart rate
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`${watchData.heartRate} BPM`, centerX, centerY + 35);

    // Draw heart icon
    ctx.fillStyle = '#ff4444';
    ctx.font = '24px Arial';
    ctx.fillText('❤', centerX - 80, centerY + 35);

    // Draw battery percentage
    ctx.fillStyle = '#88ff88';
    ctx.font = '14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`${watchData.batteryLevel}%`, centerX + radius - 15, centerY - radius + 25);

    // Draw status indicator
    const statusColor = isAbnormal ? '#ff4444' : '#88ff88';
    ctx.fillStyle = statusColor;
    ctx.beginPath();
    ctx.arc(centerX + radius - 20, centerY - radius + 20, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw steps
    ctx.fillStyle = '#aaa';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${watchData.steps.toLocaleString()} steps`, centerX, centerY + radius - 20);

    // Draw date
    const date = watchData.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.fillText(date, centerX, centerY + radius - 5);

  }, [watchData, isAbnormal]);

  const getHeartRateStatus = () => {
    if (watchData.heartRate < 60) return 'Low';
    if (watchData.heartRate > 100) return 'High';
    return 'Normal';
  };

  const getStressLevel = () => {
    if (watchData.heartRate > 100) return 'High';
    if (watchData.heartRate > 85) return 'Medium';
    return 'Low';
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg flex items-center justify-center">
              <FiHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">⌚ Virtual SmartWatch Simulator</h2>
              <p className="text-gray-600">Interactive health data simulation with realistic watch display</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {isAbnormal ? '⚠️ Abnormal Mode' : '✓ Normal Mode'}
          </div>
        </div>
      </div>

      {/* Main Watch Display */}
      <div className="card flex flex-col items-center">
        <div className="mb-6">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className="rounded-full shadow-2xl border-4 border-gray-300"
          />
        </div>

        {/* Status Information */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Heart Rate Status</p>
            <p className="text-lg font-bold text-blue-700">{getHeartRateStatus()}</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Stress Level</p>
            <p className="text-lg font-bold text-yellow-700">{getStressLevel()}</p>
          </div>
        </div>

        {/* Abnormal Mode Indicator */}
        {isAbnormal && (
          <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FiTrendingUp className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-red-800">Abnormal Heart Rate Detected</p>
                <p className="text-sm text-red-700">
                  Duration: {abnormalDuration}s | Current: {watchData.heartRate} BPM
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Control Buttons */}
        <div className="w-full space-y-4">
          <div className="flex gap-4">
            <button
              onMouseDown={increaseHeartRate}
              onMouseUp={stopIncreasing}
              onTouchStart={increaseHeartRate}
              onTouchEnd={stopIncreasing}
              onMouseLeave={stopIncreasing}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors duration-200 font-semibold text-lg shadow-lg"
            >
              <FiPlus className="w-6 h-6" />
              <span>Increase Heart Rate</span>
            </button>
            <button
              onClick={normalizeHeartRate}
              disabled={!isAbnormal}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold text-lg shadow-lg"
            >
              <FiMinus className="w-6 h-6" />
              <span>Normalize</span>
            </button>
          </div>

          <button
            onClick={resetSimulation}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-semibold shadow-lg"
          >
            <FiRotateCw className="w-5 h-5" />
            <span>Reset Simulation</span>
          </button>
        </div>
      </div>

      {/* Detailed Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <FiHeart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Heart Rate</p>
              <p className="text-2xl font-bold text-red-700">{watchData.heartRate} BPM</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <FiActivity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Steps</p>
              <p className="text-2xl font-bold text-blue-700">{watchData.steps.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <FiZap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">Calories</p>
              <p className="text-2xl font-bold text-orange-700">{watchData.calories}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-teal-50 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Distance</p>
              <p className="text-2xl font-bold text-green-700">{watchData.distance} km</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Health Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Health Overview</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <FiClock className="w-5 h-5 text-purple-600" />
                <span className="text-gray-700">Sleep Duration</span>
              </div>
              <span className="font-semibold text-gray-800">{watchData.sleepHours} hours</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <FiThermometer className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Body Temperature</span>
              </div>
              <span className="font-semibold text-gray-800">{watchData.bodyTemp}°F</span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <FiTrendingUp className="w-5 h-5 text-yellow-600" />
                <span className="text-gray-700">Stress Level</span>
              </div>
              <span className="font-semibold text-yellow-600">{getStressLevel()}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-3">
                <FiZap className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Battery Level</span>
              </div>
              <span className="font-semibold text-gray-800">{watchData.batteryLevel}%</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Use</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-semibold text-blue-800 mb-1">📊 Watch Display</p>
              <p>Shows real-time heart rate, time, battery, and steps on a realistic smartwatch face.</p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg">
              <p className="font-semibold text-red-800 mb-1">🔴 Increase Heart Rate</p>
              <p>Hold down the button to simulate abnormal heart rate conditions. Release to stop increasing.</p>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-semibold text-green-800 mb-1">✓ Normalize</p>
              <p>Click to gradually return heart rate to normal (72 BPM). Auto-normalizes after 30 seconds.</p>
            </div>

            <div className="p-3 bg-gray-100 rounded-lg">
              <p className="font-semibold text-gray-800 mb-1">🔄 Reset</p>
              <p>Reset all data to initial state and start fresh simulation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Heart Rate Chart Info */}
      <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Heart Rate Ranges</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <p className="text-sm text-gray-600 mb-2">Normal</p>
            <p className="text-2xl font-bold text-green-600">60-100 BPM</p>
            <p className="text-xs text-gray-500 mt-2">Resting heart rate</p>
          </div>
          <div className="text-center p-4 border-l border-r border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Elevated</p>
            <p className="text-2xl font-bold text-yellow-600">100-120 BPM</p>
            <p className="text-xs text-gray-500 mt-2">Light activity</p>
          </div>
          <div className="text-center p-4">
            <p className="text-sm text-gray-600 mb-2">High</p>
            <p className="text-2xl font-bold text-red-600">120+ BPM</p>
            <p className="text-xs text-gray-500 mt-2">Intense activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualSmartWatchSimulator;
