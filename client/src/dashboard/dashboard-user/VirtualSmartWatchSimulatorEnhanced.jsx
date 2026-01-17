import React, { useState, useEffect, useRef } from 'react';
import { FiHeart, FiActivity, FiZap, FiThermometer, FiClock, FiTrendingUp, FiRotateCw, FiPlus, FiMinus, FiAlertTriangle, FiMove, FiX } from 'react-icons/fi';

const VirtualSmartWatchSimulatorEnhanced = () => {
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
  const [showFallAnimation, setShowFallAnimation] = useState(false);
  const [watchPosition, setWatchPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [fallAnimationFrame, setFallAnimationFrame] = useState(0);
  const abnormalIntervalRef = useRef(null);
  const normalizeTimeoutRef = useRef(null);
  const fallAnimationRef = useRef(null);

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

  // Track abnormal duration
  useEffect(() => {
    if (isAbnormal && !heartRateIncreasing) {
      const timer = setInterval(() => {
        setAbnormalDuration(prev => prev + 1);
      }, 1000);

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

  // Fall animation loop
  useEffect(() => {
    if (showFallAnimation) {
      fallAnimationRef.current = setInterval(() => {
        setFallAnimationFrame(prev => (prev + 1) % 60);
      }, 50);

      return () => {
        if (fallAnimationRef.current) {
          clearInterval(fallAnimationRef.current);
        }
      };
    }
  }, [showFallAnimation]);

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
    setShowFallAnimation(false);
    setWatchData(prev => ({
      ...prev,
      heartRate: 72,
      steps: 8547,
      calories: 342,
      distance: 6.2,
      stressLevel: 'Low',
    }));
  };

  // Trigger fall detection
  const triggerFallDetection = () => {
    setShowFallAnimation(true);
    setIsAbnormal(true);
    setWatchData(prev => ({
      ...prev,
      heartRate: 140,
      stressLevel: 'Critical'
    }));
    
    setTimeout(() => {
      setShowFallAnimation(false);
    }, 5000);
  };

  // Handle watch dragging
  const handleMouseDown = (e) => {
    if (watchContainerRef.current && !e.target.closest('button')) {
      setIsDragging(true);
      const rect = watchContainerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const handleMouseMove = (e) => {
    if (isDragging && watchContainerRef.current) {
      const parent = watchContainerRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const newX = Math.max(0, Math.min(e.clientX - parentRect.left - dragOffset.x, parentRect.width - 320));
        const newY = Math.max(0, Math.min(e.clientY - parentRect.top - dragOffset.y, parentRect.height - 400));
        
        setWatchPosition({
          x: newX,
          y: newY
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render falling person animation
  const FallAnimation = () => {
    const progress = fallAnimationFrame / 60;
    const personY = progress * 300;
    const rotation = progress * 360;
    const opacity = Math.max(0, 1 - progress * 0.5);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-red-600">⚠️ FALL DETECTED</h3>
            <button
              onClick={() => setShowFallAnimation(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          {/* Fall Animation Canvas */}
          <div className="relative w-full h-64 bg-gradient-to-b from-blue-100 to-green-100 rounded-lg mb-6 overflow-hidden">
            {/* Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-green-200" />

            {/* Falling Person */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2 transition-all"
              style={{
                top: `${personY}px`,
                opacity: opacity,
              }}
            >
              <div
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                👤
              </div>
            </div>

            {/* Ground */}
            <div className="absolute bottom-0 w-full h-12 bg-green-600" />

            {/* Impact Effect */}
            {progress > 0.8 && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-2 bg-red-400 rounded-full blur-sm animate-pulse" />
              </div>
            )}
          </div>

          {/* Alert Information */}
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-semibold text-red-800">Emergency Alert Triggered</p>
              <p className="text-sm text-red-700 mt-2">
                Fall detected at coordinates: {watchData.lastLocation}
              </p>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="font-semibold text-orange-800">Watch ID: {watchData.watchId}</p>
              <p className="text-sm text-orange-700 mt-2">
                Heart Rate: {watchData.heartRate} BPM (Critical)
              </p>
            </div>

            <button
              onClick={() => setShowFallAnimation(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dismiss Alert
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn space-y-6 relative" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Fall Animation Modal */}
      {showFallAnimation && <FallAnimation />}

      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-500 rounded-lg flex items-center justify-center">
              <FiHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">⌚ Advanced SmartWatch Simulator</h2>
              <p className="text-gray-600">Interactive watch with fall detection and draggable display</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${
            isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {isAbnormal ? '⚠️ Alert Mode' : '✓ Normal'}
          </div>
        </div>
      </div>

      {/* Draggable Watch Display */}
      <div
        className="relative w-full"
        style={{
          minHeight: '600px',
          position: 'relative',
        }}
      >
        {/* Watch Container */}
        <div
          ref={watchContainerRef}
          onMouseDown={handleMouseDown}
          className={`absolute bg-gradient-to-br from-slate-400 to-slate-600 rounded-3xl shadow-2xl p-4 cursor-move transition-all ${
            isDragging ? 'ring-4 ring-blue-400' : ''
          }`}
          style={{
            width: '320px',
            left: `${watchPosition.x}px`,
            top: `${watchPosition.y}px`,
            userSelect: 'none',
          }}
        >
          {/* Watch Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
              <div className="w-2 h-2 bg-gray-700 rounded-full" />
            </div>
            <FiMove className="w-4 h-4 text-gray-600" />
          </div>

          {/* Watch Screen */}
          <div className="bg-white rounded-2xl p-6 space-y-4 shadow-inner">
            {/* Watch ID */}
            <div className="border-b pb-3">
              <h3 className="text-xl font-bold text-gray-800">{watchData.watchId}</h3>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Last Location:</p>
              <p className="text-lg font-semibold text-gray-800">{watchData.lastLocation}</p>
            </div>

            {/* Heart Rate */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <FiHeart className="w-5 h-5 text-red-500" />
                <p className="text-sm text-gray-600">Heart Rate:</p>
              </div>
              <p className={`text-2xl font-bold ${watchData.heartRate > 100 ? 'text-red-600' : 'text-green-600'}`}>
                {watchData.heartRate} bpn
              </p>
            </div>

            {/* PANIC/SOS Button */}
            <button
              onClick={triggerFallDetection}
              className={`w-full py-6 rounded-full font-bold text-white text-xl transition-all transform hover:scale-105 active:scale-95 ${
                showFallAnimation
                  ? 'bg-red-700 animate-pulse'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              PANIC<br />/ SOS
            </button>

            {/* Additional Info */}
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Battery:</span>
                <span className="font-semibold text-gray-800">{watchData.batteryLevel}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Steps:</span>
                <span className="font-semibold text-gray-800">{watchData.steps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Temp:</span>
                <span className="font-semibold text-gray-800">{watchData.bodyTemp}°F</span>
              </div>
            </div>
          </div>

          {/* Watch Band */}
          <div className="mt-4 space-y-2">
            <div className="h-8 bg-gradient-to-b from-slate-500 to-slate-600 rounded-lg" />
            <div className="h-8 bg-gradient-to-b from-slate-500 to-slate-600 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Control Panel</h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onMouseDown={increaseHeartRate}
              onMouseUp={stopIncreasing}
              onTouchStart={increaseHeartRate}
              onTouchEnd={stopIncreasing}
              onMouseLeave={stopIncreasing}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors duration-200 font-semibold shadow-lg"
            >
              <FiPlus className="w-6 h-6" />
              <span>Increase Heart Rate</span>
            </button>
            <button
              onClick={normalizeHeartRate}
              disabled={!isAbnormal}
              className="flex-1 flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold shadow-lg"
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

      {/* Health Metrics */}
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

      {/* Instructions */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">How to Use</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-semibold text-blue-800">🖱️ Drag the Watch</p>
            <p className="text-blue-700">Click and drag the watch display to move it around the screen</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-blue-800">❤️ Heart Rate Control</p>
            <p className="text-blue-700">Hold the button to increase heart rate, click Normalize to decrease</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-blue-800">🚨 Fall Detection</p>
            <p className="text-blue-700">Click PANIC/SOS button to trigger fall detection animation</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-blue-800">📊 Live Data</p>
            <p className="text-blue-700">Watch data updates in real-time as you interact with controls</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VirtualSmartWatchSimulatorEnhanced;
