import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw, FiX, FiCheck, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import { restrictedAreasService } from '../../services/restrictedAreasService';
import googleMapsLoader from '../../utils/googleMapsLoader';
import toast from 'react-hot-toast';

const RestrictedAreasAdminMap = () => {
  const [map, setMap] = useState(null);
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [visibleAreas, setVisibleAreas] = useState({});
  const [drawingMode, setDrawingMode] = useState(null);
  const [drawnShape, setDrawnShape] = useState(null);
  
  const mapRef = useRef(null);
  const drawnShapesRef = useRef([]);
  const unsubscribeRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskLevel: 'medium',
    type: 'circle'
  });

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    let mapInstance = null;

    const initMap = async () => {
      try {
        if (!mapRef.current || !isMounted) {
          setLoading(false);
          return;
        }

        await googleMapsLoader.loadGoogleMaps();

        if (!isMounted || !window.google || !window.google.maps) {
          if (isMounted) {
            toast.error('Google Maps API failed to load');
            setLoading(false);
          }
          return;
        }

        // Guwahati coordinates
        const guwahatiCenter = new window.google.maps.LatLng(26.1445, 91.7362);
        
        const mapOptions = {
          zoom: 13,
          center: guwahatiCenter,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true
        };

        if (!isMounted || !mapRef.current) return;

        mapInstance = new window.google.maps.Map(mapRef.current, mapOptions);
        
        if (isMounted) {
          setMap(mapInstance);
          loadRestrictedAreas(mapInstance);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
        if (isMounted) {
          toast.error('Failed to initialize map');
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Add map click listener when drawing mode changes
  useEffect(() => {
    if (!map) return;

    const handleMapClick = (event) => {
      if (drawingMode === 'polygon') {
        handlePolygonClick(event, map);
      } else if (drawingMode === 'circle') {
        handleCircleClick(event, map);
      }
    };

    if (drawingMode) {
      map.addListener('click', handleMapClick);
    }

    return () => {
      if (drawingMode && map) {
        window.google.maps.event.clearListeners(map, 'click');
      }
    };
  }, [drawingMode, map]);

  const loadRestrictedAreas = async (mapInstance) => {
    try {
      setLoading(true);
      const unsubscribe = restrictedAreasService.listenToRestrictedAreas((areas) => {
        try {
          if (!Array.isArray(areas)) {
            console.warn('Areas is not an array:', areas);
            areas = [];
          }

          setRestrictedAreas(areas);
          
          if (mapInstance && window.google && window.google.maps) {
            renderRestrictedAreas(areas, mapInstance);
          }

          const visibilityState = {};
          areas.forEach(area => {
            if (area && area.id) {
              visibilityState[area.id] = true;
            }
          });
          setVisibleAreas(visibilityState);
        } catch (error) {
          console.error('Error processing restricted areas:', error);
        }
      });

      unsubscribeRef.current = unsubscribe;
      setLoading(false);
    } catch (error) {
      console.error('Error loading restricted areas:', error);
      toast.error('Failed to load restricted areas');
      setLoading(false);
    }
  };

  const handlePolygonClick = (event, mapInstance) => {
    // Simple polygon drawing - click to add points
    if (!drawnShape) {
      const polygon = new window.google.maps.Polygon({
        paths: [event.latLng],
        map: mapInstance,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        strokeColor: '#FF0000',
        strokeWeight: 2,
        editable: true,
        draggable: true
      });

      setDrawnShape({ type: 'polygon', shape: polygon, points: [event.latLng] });
    } else if (drawnShape.type === 'polygon') {
      const newPoints = [...drawnShape.points, event.latLng];
      drawnShape.shape.setPaths([newPoints]);
      setDrawnShape({ ...drawnShape, points: newPoints });
    }
  };

  const handleCircleClick = (event, mapInstance) => {
    if (!drawnShape) {
      const circle = new window.google.maps.Circle({
        center: event.latLng,
        radius: 500,
        map: mapInstance,
        fillColor: '#FF0000',
        fillOpacity: 0.2,
        strokeColor: '#FF0000',
        strokeWeight: 2,
        editable: true,
        draggable: true
      });

      setDrawnShape({ type: 'circle', shape: circle, center: event.latLng, radius: 500 });
    }
  };

  const startDrawing = (type) => {
    // Clear previous shapes
    if (drawnShape && drawnShape.shape) {
      drawnShape.shape.setMap(null);
    }
    setDrawnShape(null);
    setDrawingMode(type);
    toast.success(`Click on map to draw ${type}`);
  };

  const finishDrawing = () => {
    if (!drawnShape) {
      toast.error('Please draw a shape first');
      return;
    }
    setDrawingMode(null);
    setShowModal(true);
  };

  const handleSaveArea = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    if (!drawnShape) {
      toast.error('Please draw a shape first');
      return;
    }

    const saveToast = toast.loading('Saving restricted area...');

    try {
      const areaData = {
        name: formData.name,
        description: formData.description,
        riskLevel: formData.riskLevel,
        type: drawnShape.type
      };

      if (drawnShape.type === 'polygon') {
        areaData.polygon = drawnShape.points.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));
      } else if (drawnShape.type === 'circle') {
        areaData.center = {
          lat: drawnShape.center.lat(),
          lng: drawnShape.center.lng()
        };
        areaData.radius = drawnShape.radius;
      }

      const result = await restrictedAreasService.saveRestrictedArea(areaData);

      if (result.success) {
        toast.dismiss(saveToast);
        toast.success('Restricted area created successfully!');

        // Clear form and map
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          riskLevel: 'medium',
          type: 'circle'
        });

        if (drawnShape && drawnShape.shape) {
          drawnShape.shape.setMap(null);
        }
        setDrawnShape(null);
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

  const renderRestrictedAreas = (areas, mapInstance) => {
    try {
      // Clear existing shapes safely
      if (drawnShapesRef.current && Array.isArray(drawnShapesRef.current)) {
        drawnShapesRef.current.forEach(shape => {
          try {
            if (shape && shape.setMap) {
              shape.setMap(null);
            }
          } catch (e) {
            console.warn('Error clearing shape:', e);
          }
        });
      }
      drawnShapesRef.current = [];

      if (!mapInstance || !areas || areas.length === 0) return;

      // Render each area
      areas.forEach(area => {
        try {
          if (!area.id) return;
          if (!visibleAreas[area.id]) return;

          if (area.type === 'polygon' && area.polygon && Array.isArray(area.polygon) && area.polygon.length > 0) {
            const paths = area.polygon.map(p => {
              if (p && typeof p.lat === 'number' && typeof p.lng === 'number') {
                return new window.google.maps.LatLng(p.lat, p.lng);
              }
              return null;
            }).filter(p => p !== null);

            if (paths.length === 0) return;

            const polygon = new window.google.maps.Polygon({
              paths: paths,
              map: mapInstance,
              fillColor: '#EF4444',
              fillOpacity: 0.2,
              strokeColor: '#EF4444',
              strokeWeight: 2
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 10px;">
                <strong>${area.name || 'Area'}</strong><br/>
                ${area.description || ''}<br/>
                <span style="color: #666; font-size: 12px;">Risk: ${area.riskLevel || 'unknown'}</span>
              </div>`
            });

            polygon.addListener('click', () => {
              if (paths.length > 0) {
                infoWindow.open(mapInstance, paths[0]);
              }
            });

            drawnShapesRef.current.push(polygon);
          } else if (area.type === 'circle' && area.center && typeof area.center.lat === 'number' && typeof area.center.lng === 'number' && typeof area.radius === 'number') {
            const circle = new window.google.maps.Circle({
              center: new window.google.maps.LatLng(area.center.lat, area.center.lng),
              radius: area.radius,
              map: mapInstance,
              fillColor: '#EF4444',
              fillOpacity: 0.2,
              strokeColor: '#EF4444',
              strokeWeight: 2
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div style="padding: 10px;">
                <strong>${area.name || 'Area'}</strong><br/>
                ${area.description || ''}<br/>
                <span style="color: #666; font-size: 12px;">Risk: ${area.riskLevel || 'unknown'}</span>
              </div>`
            });

            circle.addListener('click', () => {
              infoWindow.open(mapInstance, area.center);
            });

            drawnShapesRef.current.push(circle);
          }
        } catch (error) {
          console.warn('Error rendering area:', area?.name, error);
        }
      });
    } catch (error) {
      console.error('Error in renderRestrictedAreas:', error);
    }
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
            <p className="text-sm text-gray-600">Draw and manage geofenced restricted areas on Google Map</p>
          </div>
        </div>
      </div>

      {/* Drawing Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => startDrawing('polygon')}
          disabled={drawingMode !== null}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
            drawingMode === 'polygon'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <FiMapPin className="w-4 h-4" />
          Draw Polygon
        </button>

        <button
          onClick={() => startDrawing('circle')}
          disabled={drawingMode !== null}
          className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 ${
            drawingMode === 'circle'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          <FiMapPin className="w-4 h-4" />
          Draw Circle
        </button>

        {drawingMode && (
          <button
            onClick={finishDrawing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
          >
            <FiCheck className="w-4 h-4" />
            Finish & Save
          </button>
        )}

        {drawingMode && (
          <button
            onClick={() => {
              setDrawingMode(null);
              if (drawnShape && drawnShape.shape) {
                drawnShape.shape.setMap(null);
              }
              setDrawnShape(null);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Cancel
          </button>
        )}
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
        <p><strong>How to use:</strong> Click "Draw Polygon" or "Draw Circle", then click on the map to draw. Click "Finish & Save" to add details and save to Firestore.</p>
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

export default RestrictedAreasAdminMap;
