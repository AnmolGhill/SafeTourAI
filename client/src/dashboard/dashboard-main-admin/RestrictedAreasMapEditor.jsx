import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw, FiX, FiCheck, FiMapPin, FiEye, FiEyeOff, FiMap, FiCircle } from 'react-icons/fi';
import { restrictedAreasService } from '../../services/restrictedAreasService';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';

const RestrictedAreasMapEditor = () => {
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [visibleAreas, setVisibleAreas] = useState({});
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const featureGroupRef = useRef(null);
  const drawnLayersRef = useRef({});
  const unsubscribeRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskLevel: 'medium'
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize Leaflet map
    const map = L.map(mapRef.current).setView([26.1445, 91.7362], 13);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Create feature group for drawings
    const featureGroup = new L.FeatureGroup();
    map.addLayer(featureGroup);

    // Initialize draw control
    const drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: true,
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: featureGroup,
        remove: true
      }
    });
    map.addControl(drawControl);

    // Handle draw events
    map.on('draw:created', (e) => {
      const layer = e.layer;
      featureGroup.addLayer(layer);
      handleShapeDrawn(layer);
    });

    mapInstanceRef.current = map;
    featureGroupRef.current = featureGroup;

    // Load restricted areas
    loadRestrictedAreas(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  const loadRestrictedAreas = async (map) => {
    try {
      setLoading(true);
      const unsubscribe = restrictedAreasService.listenToRestrictedAreas((areas) => {
        setRestrictedAreas(areas);
        renderRestrictedAreas(areas, map);

        const visibilityState = {};
        areas.forEach(area => {
          visibilityState[area.id] = true;
        });
        setVisibleAreas(visibilityState);
      });

      unsubscribeRef.current = unsubscribe;
      setLoading(false);
    } catch (error) {
      console.error('Error loading restricted areas:', error);
      toast.error('Failed to load restricted areas');
      setLoading(false);
    }
  };

  const handleShapeDrawn = (layer) => {
    // Clear previous shapes
    featureGroupRef.current.eachLayer((l) => {
      if (l !== layer) {
        featureGroupRef.current.removeLayer(l);
      }
    });

    setShowModal(true);
  };

  const convertShapeToData = (layer) => {
    const data = {};

    if (layer instanceof L.Polygon && !(layer instanceof L.Circle)) {
      // Polygon
      data.type = 'polygon';
      data.polygon = layer.getLatLngs()[0].map(latlng => ({
        lat: latlng.lat,
        lng: latlng.lng
      }));
    } else if (layer instanceof L.Circle) {
      // Circle
      data.type = 'circle';
      const center = layer.getLatLng();
      data.center = {
        lat: center.lat,
        lng: center.lng
      };
      data.radius = layer.getRadius();
    }

    return data;
  };

  const handleSaveArea = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    const layers = featureGroupRef.current.getLayers();
    if (layers.length === 0) {
      toast.error('Please draw a shape first');
      return;
    }

    const layer = layers[0];
    const shapeData = convertShapeToData(layer);

    if (!shapeData.type) {
      toast.error('Invalid shape');
      return;
    }

    const saveToast = toast.loading('Saving restricted area...');

    try {
      const areaData = {
        name: formData.name,
        description: formData.description,
        riskLevel: formData.riskLevel,
        ...shapeData
      };

      const result = await restrictedAreasService.saveRestrictedArea(areaData);

      if (result.success) {
        toast.dismiss(saveToast);
        toast.success('Restricted area created successfully!');

        // Clear form and map
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          riskLevel: 'medium'
        });
        featureGroupRef.current.clearLayers();
      } else {
        toast.dismiss(saveToast);
        toast.error(result.error || 'Failed to save restricted area');
      }
    } catch (error) {
      toast.dismiss(saveToast);
      toast.error('Error saving restricted area');
      console.error('Error:', error);
    }
  };

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to delete this restricted area?')) {
      return;
    }

    const deleteToast = toast.loading('Deleting restricted area...');

    try {
      const result = await restrictedAreasService.deleteRestrictedArea(areaId);

      if (result.success) {
        toast.dismiss(deleteToast);
        toast.success('Restricted area deleted successfully!');
      } else {
        toast.dismiss(deleteToast);
        toast.error(result.error || 'Failed to delete restricted area');
      }
    } catch (error) {
      toast.dismiss(deleteToast);
      toast.error('Error deleting restricted area');
      console.error('Error:', error);
    }
  };

  const handleToggleVisibility = (areaId) => {
    setVisibleAreas(prev => ({
      ...prev,
      [areaId]: !prev[areaId]
    }));
  };

  const renderRestrictedAreas = (areas, map) => {
    // Clear existing layers
    Object.values(drawnLayersRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    drawnLayersRef.current = {};

    // Render each area
    areas.forEach(area => {
      if (!visibleAreas[area.id]) return;

      try {
        if (area.type === 'polygon' && area.polygon && area.polygon.length > 0) {
          const polygon = L.polygon(
            area.polygon.map(p => [p.lat, p.lng]),
            {
              color: '#ef4444',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2
            }
          ).addTo(map);

          polygon.bindPopup(`<strong>${area.name}</strong><br/>${area.description || ''}`);
          drawnLayersRef.current[area.id] = polygon;
        } else if (area.type === 'circle' && area.center && area.radius) {
          const circle = L.circle(
            [area.center.lat, area.center.lng],
            {
              radius: area.radius,
              color: '#ef4444',
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.2
            }
          ).addTo(map);

          circle.bindPopup(`<strong>${area.name}</strong><br/>${area.description || ''}`);
          drawnLayersRef.current[area.id] = circle;
        }
      } catch (error) {
        console.error('Error rendering area:', area.name, error);
      }
    });
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <h3 className="text-lg font-semibold text-gray-800">Restricted Areas Manager</h3>
            <p className="text-sm text-gray-600">Draw and manage geofenced restricted areas</p>
          </div>
        </div>
        <button
          onClick={loadRestrictedAreas}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Map */}
      <div className="relative mb-4">
        <div
          ref={mapRef}
          style={{ height: '500px', width: '100%' }}
          className="bg-gray-100 rounded-lg"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="text-center">
                <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-2 animate-spin" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
        <p><strong>How to use:</strong> Click the draw tools in the top-left of the map to draw polygons or circles. After drawing, fill in the area details and save.</p>
      </div>

      {/* Restricted Areas List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Active Restricted Areas ({restrictedAreas.length})</h4>
        
        {restrictedAreas.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            <FiMapPin className="mx-auto w-8 h-8 text-gray-400 mb-2" />
            <p>No restricted areas created yet. Draw one on the map to get started.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {restrictedAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(area.riskLevel)}`}>
                    {area.riskLevel.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{area.name}</h5>
                    <p className="text-xs text-gray-600">
                      {area.type === 'circle' 
                        ? `Circle • ${(area.radius / 1000).toFixed(2)} km radius`
                        : `Polygon • ${area.polygon?.length || 0} points`
                      }
                    </p>
                    {area.description && (
                      <p className="text-xs text-gray-500 mt-1">{area.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleVisibility(area.id)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors duration-200"
                    title={visibleAreas[area.id] ? 'Hide' : 'Show'}
                  >
                    {visibleAreas[area.id] ? (
                      <FiEye className="w-4 h-4" />
                    ) : (
                      <FiEyeOff className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteArea(area.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for area details */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Area Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Area Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Paltan Bazaar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, riskLevel: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveArea}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <FiCheck className="w-4 h-4" />
                <span>Save Area</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestrictedAreasMapEditor;
