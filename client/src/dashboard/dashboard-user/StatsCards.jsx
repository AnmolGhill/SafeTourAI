import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiBell, 
  FiLink,
  FiUsers,
  FiActivity,
  FiHash,
  FiShield,
  FiTrendingUp,
  FiTrendingDown,
  FiLoader,
  FiCheckCircle,
  FiUser,
  FiPhone
} from 'react-icons/fi';
import { safetyService } from '../../services/safetyService';

const StatsCards = () => {
  const [stats, setStats] = useState({
    kycStatus: 'pending',
    digitalIdActive: false,
    securityScore: 0,
    safetyScore: 0,
    safetyLevel: 'Calculating...',
    emergencyContactsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserStats();
    fetchSafetyScore();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchUserStats();
      fetchSafetyScore();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('/api/user/kyc-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Failed to fetch user statistics: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('✅ Raw API Response:', responseText);
      console.log('📊 Response length:', responseText.length);
      console.log('🔍 Response type:', typeof responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Parsed JSON data:', data);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('❌ Response that failed to parse:', responseText);
        throw new Error('Invalid JSON response from server');
      }
      
      const newStats = {
        kycStatus: data.kycStatus,
        blockchainId: data.blockchainId,
        verificationLevel: data.verificationLevel,
        digitalIdActive: data.digitalIdActive,
        digitalIdCreated: data.digitalIdCreated,
        securityScore: data.securityScore,
        securityLevel: data.securityLevel,
        safetyScore: stats.safetyScore, // Keep existing safety score
        safetyLevel: stats.safetyLevel, // Keep existing safety level
        emergencyContactsCount: data.emergencyContactsCount,
        emergencyContactsConfigured: data.emergencyContactsConfigured
      };
      
      console.log('📈 Setting new stats:', newStats);
      setStats(newStats);
      
      console.log('✅ Setting loading to false');
      setLoading(false);
      setInitialRender(false);
      setError(null);

    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err.message);
      setLoading(false);
      setInitialRender(false);
      
      // Fallback to default values
      setStats({
        kycStatus: 'pending',
        digitalIdActive: false,
        securityScore: 0,
        emergencyContactsCount: 0
      });
    }
  };

  const fetchSafetyScore = async () => {
    try {
      // Get user's current location
      const location = await safetyService.getCurrentLocation();
      
      // Get safety analysis from backend
      const safetyResult = await safetyService.getSafetyAnalysis(
        location.lat, 
        location.lng, 
        'general'
      );

      if (safetyResult.success) {
        const safetyScore = safetyResult.data.safetyScore?.overallScore || 0;
        const riskLevel = safetyResult.data.riskLevel || 'unknown';
        
        setStats(prevStats => ({
          ...prevStats,
          safetyScore: safetyScore,
          safetyLevel: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)
        }));
      }
    } catch (err) {
      console.error('Error fetching safety score:', err);
      // Set default values if location/safety fetch fails
      setStats(prevStats => ({
        ...prevStats,
        safetyScore: 0,
        safetyLevel: 'Unavailable'
      }));
    }
  };

  const cardData = [
    {
      title: 'KYC Verification',
      value: stats.kycStatus === 'approved' ? 'Verified' : stats.kycStatus === 'pending' ? 'Pending' : 'Not Started',
      icon: FiCheckCircle,
      color: stats.kycStatus === 'approved' ? 'green' : stats.kycStatus === 'pending' ? 'yellow' : 'gray',
    },
    {
      title: 'Digital Identity',
      value: stats.digitalIdActive ? 'Active' : 'Inactive',
      description: 'Blockchain identity status',
      icon: FiUser,
      iconColor: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      trendUp: true,
      progress: stats.digitalIdActive ? 100 : 0,
      progressColor: '#3b82f6',
      cardAccent: '#3b82f6'
    },
    {
      title: 'Safety Score',
      value: `${stats.safetyScore || 0}%`,
      description: 'Current safety rating',
      icon: FiActivity,
      iconColor: (stats.safetyScore || 0) >= 70 ? 'linear-gradient(135deg, #10b981, #059669)' : 
                 (stats.safetyScore || 0) >= 40 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 
                 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: (stats.safetyScore || 0) >= 70 ? 'green' : (stats.safetyScore || 0) >= 40 ? 'yellow' : 'red',
      bgColor: (stats.safetyScore || 0) >= 70 ? 'bg-green-50' : (stats.safetyScore || 0) >= 40 ? 'bg-yellow-50' : 'bg-red-50',
      iconBg: (stats.safetyScore || 0) >= 70 ? 'bg-green-100' : (stats.safetyScore || 0) >= 40 ? 'bg-yellow-100' : 'bg-red-100',
      trendUp: (stats.safetyScore || 0) >= 70,
      progress: stats.safetyScore,
      progressColor: (stats.safetyScore || 0) >= 70 ? '#10b981' : (stats.safetyScore || 0) >= 40 ? '#f59e0b' : '#ef4444',
      cardAccent: (stats.safetyScore || 0) >= 70 ? '#10b981' : (stats.safetyScore || 0) >= 40 ? '#f59e0b' : '#ef4444'
    },
    {
      title: 'Emergency Contacts',
      value: (stats.emergencyContactsCount || 0).toString(),
      description: 'Registered contacts',
      icon: FiPhone,
      iconColor: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      trendUp: true,
      progress: Math.min((stats.emergencyContactsCount || 0) * 25, 100),
      progressColor: '#8b5cf6',
      cardAccent: '#8b5cf6'
    }
  ];

  const refreshStats = async () => {
    await fetchUserStats();
  };

  // Always render the component structure to prevent layout shifts
  const renderSkeletonCards = () => (
    <div className="stats-grid" style={{ minHeight: '200px' }}>
      {[1, 2, 3, 4].map((index) => (
        <div key={index} className="stat-card animate-pulse" style={{ height: '160px' }}>
          <div className="stat-header" style={{ marginBottom: '1rem' }}>
            <div className="bg-gray-200 w-12 h-12 rounded-lg"></div>
            <div className="bg-gray-200 h-4 w-24 rounded"></div>
          </div>
          <div>
            <div className="bg-gray-200 h-4 w-32 rounded mb-2"></div>
            <div className="bg-gray-200 h-8 w-20 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 w-28 rounded mb-1"></div>
            <div className="bg-gray-200 h-3 w-20 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mb-6" style={{ minHeight: '300px' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Personal Dashboard</h2>
        <button
          onClick={refreshStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   transition-colors duration-200 text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm"> {error}</p>
        </div>
      )}

      {loading ? renderSkeletonCards() : (
      <div className="mobile-cards-grid">
        {cardData.map((card, index) => {
          const Icon = card.icon;
          const TrendIcon = card.trendUp ? FiTrendingUp : FiTrendingDown;
          
          return (
            <div
              key={index}
              className="mobile-card"
              data-color={card.color}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-icon" style={{ 
                  background: card.iconColor,
                  boxShadow: `0 4px 12px ${card.cardAccent}40`
                }}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="mobile-card-title">{card.title}</div>
              </div>
              
              <div className="mobile-card-content">
                <div className="mobile-card-value">
                  {card.value}
                </div>
                <div className="mobile-card-description">{card.description}</div>
                
                {card.progress && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '3px',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div 
                        style={{ 
                          width: `${card.progress}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${card.progressColor || '#3b82f6'}, ${card.progressColor ? card.progressColor + '80' : '#1d4ed8'})`,
                          borderRadius: '3px',
                          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                        }}
                      ></div>
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: '#6b7280', 
                      marginTop: '0.5rem',
                      fontWeight: '500'
                    }}>
                      {card.progress}% Complete
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Quick Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-wrap items-center justify-between text-sm text-gray-600">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>{stats.kycStatus === 'approved' ? 'Profile verified' : 'Profile incomplete'}</span>
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live monitoring active</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
