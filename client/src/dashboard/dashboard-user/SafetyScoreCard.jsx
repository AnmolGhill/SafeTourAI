import React, { useState, useEffect } from 'react';
import { 
  FiShield, 
  FiMapPin, 
  FiCloud, 
  FiAlertTriangle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity
} from 'react-icons/fi';
import { safetyService } from '../../services/safetyService';

const SafetyScoreCard = () => {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    initializeSafetyScore();
    // Update every 5 minutes
    const interval = setInterval(initializeSafetyScore, 300000);
    return () => clearInterval(interval);
  }, []);

  const initializeSafetyScore = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user's current location
      const userLocation = await safetyService.getCurrentLocation();
      setLocation(userLocation);

      // Get comprehensive safety data
      await updateSafetyScore(userLocation.lat, userLocation.lng);
      
    } catch (err) {
      console.error('Safety score initialization error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const updateSafetyScore = async (lat, lng) => {
    try {
      // Fetch all safety-related data in parallel
      const [weatherResult, servicesResult, analysisResult] = await Promise.all([
        safetyService.getCurrentWeather(lat, lng),
        safetyService.getNearbyServices(lat, lng),
        safetyService.getSafetyAnalysis(lat, lng, 'general')
      ]);

      let calculatedScore;
      
      // Use backend analysis if available, otherwise calculate locally
      if (analysisResult.success && analysisResult.data.safetyScore) {
        calculatedScore = {
          overallScore: analysisResult.data.safetyScore.overallScore,
          riskLevel: analysisResult.data.riskLevel,
          factors: [
            {
              name: 'Weather Conditions',
              score: analysisResult.data.safetyScore.weatherScore,
              weight: 40,
              details: analysisResult.data.weatherData?.riskAssessment?.recommendations || []
            },
            {
              name: 'Emergency Services',
              score: analysisResult.data.safetyScore.infrastructureScore,
              weight: 40,
              details: [`${analysisResult.data.emergencyServices?.length || 0} services nearby`]
            },
            {
              name: 'Environmental Factors',
              score: analysisResult.data.safetyScore.environmentalScore,
              weight: 20,
              details: analysisResult.data.safetyScore.environmentalFactors || []
            }
          ],
          recommendations: analysisResult.data.recommendations || []
        };
      } else {
        // Fallback to local calculation
        calculatedScore = safetyService.calculateSafetyScore(
          weatherResult.success ? weatherResult.data : null,
          servicesResult.success ? servicesResult.data : null,
          { lat, lng }
        );
      }

      setSafetyData({
        score: calculatedScore,
        weather: weatherResult.success ? weatherResult.data : null,
        services: servicesResult.success ? servicesResult.data : null,
        location: { lat, lng }
      });
      
      setLastUpdated(new Date());
      setLoading(false);

    } catch (err) {
      console.error('Safety score update error:', err);
      setError('Failed to update safety score');
      setLoading(false);
    }
  };

  const refreshSafetyScore = async () => {
    if (location) {
      await updateSafetyScore(location.lat, location.lng);
    } else {
      await initializeSafetyScore();
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-gray-200 h-6 w-32 rounded"></div>
        <div className="bg-gray-200 h-8 w-8 rounded"></div>
      </div>
      <div className="text-center mb-6">
        <div className="bg-gray-200 h-16 w-16 rounded-full mx-auto mb-4"></div>
        <div className="bg-gray-200 h-8 w-24 rounded mx-auto mb-2"></div>
        <div className="bg-gray-200 h-4 w-32 rounded mx-auto"></div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 h-4 w-full rounded"></div>
        ))}
      </div>
    </div>
  );

  if (loading) return renderLoadingSkeleton();

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <FiAlertTriangle className="text-red-500 text-4xl mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Safety Score Unavailable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={initializeSafetyScore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const score = safetyData?.score?.overallScore || 0;
  const riskLevel = safetyData?.score?.riskLevel || 'unknown';
  const scoreColor = safetyService.getSafetyScoreColor(score);
  const riskColor = safetyService.getRiskLevelColor(riskLevel);

  return (
    <div className="safety-score-card bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FiShield className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-800">Safety Score</h3>
        </div>
        <button
          onClick={refreshSafetyScore}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
          title="Refresh Safety Score"
        >
          <FiRefreshCw className={`text-lg ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Score Display */}
      <div className="text-center mb-6">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${scoreColor} mb-4`}>
          <span className="text-2xl font-bold">{score}%</span>
        </div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${riskColor} mb-2`}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
        </div>
        <p className="text-gray-600 text-sm">
          Based on current location and conditions
        </p>
      </div>

      {/* Safety Factors */}
      {safetyData?.score?.factors && (
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Safety Factors</h4>
          {safetyData.score.factors.map((factor, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  factor.score >= 80 ? 'bg-green-500' :
                  factor.score >= 60 ? 'bg-yellow-500' :
                  factor.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-700">{factor.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium">{Math.round(factor.score)}%</span>
                {factor.score >= 70 ? (
                  <FiTrendingUp className="text-green-500 text-xs" />
                ) : (
                  <FiTrendingDown className="text-red-500 text-xs" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {safetyData?.weather && (
          <div className="flex items-center space-x-2">
            <FiCloud className="text-blue-500" />
            <div>
              <p className="text-xs text-gray-500">Weather</p>
              <p className="text-sm font-medium">{safetyData.weather.current.condition}</p>
            </div>
          </div>
        )}
        {safetyData?.services && (
          <div className="flex items-center space-x-2">
            <FiActivity className="text-green-500" />
            <div>
              <p className="text-xs text-gray-500">Emergency Services</p>
              <p className="text-sm font-medium">{safetyData.services.services?.length || 0} nearby</p>
            </div>
          </div>
        )}
      </div>

      {/* Location Info */}
      {location && (
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <FiMapPin />
          <span>
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Top Recommendations */}
      {safetyData?.score?.recommendations && safetyData.score.recommendations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Safety Tips</h4>
          <ul className="space-y-1">
            {safetyData.score.recommendations.slice(0, 2).map((rec, index) => (
              <li key={index} className="text-xs text-gray-600 flex items-start space-x-1">
                <span className="text-blue-500 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SafetyScoreCard;
