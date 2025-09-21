import React, { useState, useEffect } from 'react';
import { 
  FiAlertTriangle, 
  FiMapPin, 
  FiEye,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiClock,
  FiTrendingUp
} from 'react-icons/fi';

const DangerZoneHeatmap = () => {
  const [dangerZones, setDangerZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [heatmapStats, setHeatmapStats] = useState({
    totalZones: 0,
    highRiskZones: 0,
    recentIncidents: 0,
    lastUpdated: new Date()
  });

  // Mock danger zones data - replace with real API call
  const mockDangerZones = [
    {
      id: 1,
      name: "Downtown Market Area",
      location: { lat: 40.7128, lng: -74.0060 },
      riskLevel: "high",
      riskScore: 85,
      incidents: 12,
      lastIncident: "2 hours ago",
      type: "theft",
      description: "High pickpocket activity reported",
      color: "#ef4444"
    },
    {
      id: 2,
      name: "Tourist District",
      location: { lat: 40.7589, lng: -73.9851 },
      riskLevel: "medium",
      riskScore: 65,
      incidents: 7,
      lastIncident: "1 day ago",
      type: "scam",
      description: "Tourist scam activities",
      color: "#f97316"
    },
    {
      id: 3,
      name: "Central Park North",
      location: { lat: 40.7829, lng: -73.9654 },
      riskLevel: "low",
      riskScore: 25,
      incidents: 2,
      lastIncident: "1 week ago",
      type: "minor",
      description: "Occasional minor incidents",
      color: "#22c55e"
    },
    {
      id: 4,
      name: "Nightlife District",
      location: { lat: 40.7505, lng: -73.9934 },
      riskLevel: "high",
      riskScore: 78,
      incidents: 9,
      lastIncident: "4 hours ago",
      type: "assault",
      description: "Late night safety concerns",
      color: "#ef4444"
    },
    {
      id: 5,
      name: "Shopping Center",
      location: { lat: 40.7614, lng: -73.9776 },
      riskLevel: "medium",
      riskScore: 45,
      incidents: 4,
      lastIncident: "3 days ago",
      type: "theft",
      description: "Bag snatching incidents",
      color: "#f97316"
    }
  ];

  // Fetch danger zones data
  const fetchDangerZones = async () => {
    setLoading(true);
    try {
      // Simulate API call - replace with real endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDangerZones(mockDangerZones);
      
      // Calculate stats
      const stats = {
        totalZones: mockDangerZones.length,
        highRiskZones: mockDangerZones.filter(zone => zone.riskLevel === 'high').length,
        recentIncidents: mockDangerZones.reduce((sum, zone) => sum + zone.incidents, 0),
        lastUpdated: new Date()
      };
      setHeatmapStats(stats);
    } catch (error) {
      console.error('Error fetching danger zones:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDangerZones();
  }, []);

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level) {
      case 'high': return <FiAlertTriangle className="w-4 h-4" />;
      case 'medium': return <FiClock className="w-4 h-4" />;
      case 'low': return <FiShield className="w-4 h-4" />;
      default: return <FiMapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <FiMapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Danger Zone Heatmap</h3>
            <p className="text-sm text-gray-600">Real-time tourist safety zones</p>
          </div>
        </div>
        <button
          onClick={fetchDangerZones}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiMapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Zones</span>
          </div>
          <p className="text-xl font-bold text-blue-900 mt-1">{heatmapStats.totalZones}</p>
        </div>
        
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiAlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">High Risk</span>
          </div>
          <p className="text-xl font-bold text-red-900 mt-1">{heatmapStats.highRiskZones}</p>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiTrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Incidents</span>
          </div>
          <p className="text-xl font-bold text-orange-900 mt-1">{heatmapStats.recentIncidents}</p>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <FiClock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Updated</span>
          </div>
          <p className="text-xs font-medium text-green-900 mt-1">
            {heatmapStats.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Danger Zones List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">Active Danger Zones</h4>
          <span className="text-sm text-gray-500">{dangerZones.length} zones monitored</span>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dangerZones.map((zone) => (
              <div
                key={zone.id}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${
                  selectedZone?.id === zone.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedZone(selectedZone?.id === zone.id ? null : zone)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getRiskLevelColor(zone.riskLevel)}`}>
                      {getRiskLevelIcon(zone.riskLevel)}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-800">{zone.name}</h5>
                      <p className="text-sm text-gray-600">{zone.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-800">{zone.riskScore}%</span>
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${zone.riskScore}%`,
                            backgroundColor: zone.color
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{zone.incidents} incidents</p>
                  </div>
                </div>
                
                {selectedZone?.id === zone.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Last Incident:</span>
                        <p className="font-medium text-gray-800">{zone.lastIncident}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Incident Type:</span>
                        <p className="font-medium text-gray-800 capitalize">{zone.type}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-2">
                      <FiEye className="w-4 h-4 text-blue-600" />
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('showZoneOnMap', { detail: zone }))}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View on Map
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Data updated every 15 minutes</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live monitoring active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DangerZoneHeatmap;
