import React, { useState, useEffect, useRef } from 'react';
import {
  FiMapPin,
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiMap,
  FiCircle,
  FiEdit2,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import { restrictedAreasService } from '../../services/restrictedAreasService';
import googleMapsLoader from '../../utils/googleMapsLoader';
import toast from 'react-hot-toast';

const RestrictedAreasManager = () => {
  const [map, setMap] = useState(null);
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawingMode, setDrawingMode] = useState(null);
  const [drawingManager, setDrawingManager] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [areaDescription, setAreaDescription] = useState('');
  const [areaRiskLevel, setAreaRiskLevel] = useState('medium');
  const [drawnShape, setDrawnShape] = useState(null);
  const [shapeType, setShapeType] = useState(null);
  const [visibleAreas, setVisibleAreas] = useState({});
  const mapRef = useRef(null);
  const drawnShapesRef = useRef([]);
  const unsubscribeRef = useRef(null);

  // Initialize Drawing Manager
  const initializeDrawingManager = (mapInstance) => {
    try {
      // Check if drawing library is available
      if (!window.google || !window.google.maps || !window.google.maps.drawing) {
        console.error('Drawing library not available');
        toast.error('Drawing library not available. Please refresh the page.');
        return false;
      }

      const drawingManagerInstance = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        polygonOptions: {
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          strokeColor: '#FF0000',
          strokeWeight: 2,
          editable: true,
          draggable: true
        },
        circleOptions: {
          fillColor: '#FF0000',
          fillOpacity: 0.2,
          strokeColor: '#FF0000',
          strokeWeight: 2,
          editable: true,
          draggable: true
        }
      });

      drawingManagerInstance.setMap(mapInstance);
      setDrawingManager(drawingManagerInstance);

      // Listen for shape completion
      window.google.maps.event.addListener(drawingManagerInstance, 'overlaycomplete', (event) => {
        handleShapeDrawn(event, drawingManagerInstance);
      });

      console.log('✅ Drawing Manager initialized');
      return true;
    } catch (error) {
      console.error('Error initializing drawing manager:', error);
      toast.error('Failed to initialize drawing tools');
      return false;
    }
  };

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;

    const initMap = async () => {
      try {
        if (!mapRef.current || !isMounted) {
          setLoading(false);
          return;
        }

        // Load Google Maps
        await googleMapsLoader.loadGoogleMaps();

        if (!isMounted || !mapRef.current) return;

        if (!window.google || !window.google.maps) {
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

        const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
        
        if (!isMounted) return;
        
        setMap(newMap);

        // Try to initialize drawing manager
        const tryInitDrawing = () => {
          if (!isMounted) return;
          
          if (window.google && window.google.maps && window.google.maps.drawing && window.google.maps.drawing.DrawingManager) {
            console.log('✅ Drawing library available');
            const success = initializeDrawingManager(newMap);
            if (success && isMounted) {
              loadRestrictedAreas();
            }
          } else {
            console.warn('⚠️ Drawing library not available yet');
            if (isMounted) {
              setLoading(false);
              toast.error('Drawing library not available. Please refresh the page.');
            }
          }
        };

        // Try immediately
        if (window.google && window.google.maps && window.google.maps.drawing) {
          tryInitDrawing();
        } else {
          // Retry after delay
          retryTimer = setTimeout(tryInitDrawing, 1500);
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
      if (retryTimer) clearTimeout(retryTimer);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const loadRestrictedAreas = async () => {
    try {
      // Listen to real-time updates
      const unsubscribe = restrictedAreasService.listenToRestrictedAreas((areas) => {
        setRestrictedAreas(areas);
        renderRestrictedAreas(areas);
        
        // Initialize visibility state
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

  const handleShapeDrawn = (event, manager) => {
    // Remove previous drawn shape
    if (drawnShapesRef.current.length > 0) {
      drawnShapesRef.current.forEach(shape => shape.setMap(null));
      drawnShapesRef.current = [];
    }

    const shape = event.overlay;
    const type = event.type;

    drawnShapesRef.current.push(shape);
    setDrawnShape(shape);
    setShapeType(type);
    setDrawingMode(null);
    manager.setDrawingMode(null);

    // Show modal to get area name
    setShowModal(true);
  };

  const convertShapeToData = () => {
    if (!drawnShape || !shapeType) return null;

    const data = {
      type: shapeType === window.google.maps.drawing.OverlayType.POLYGON ? 'polygon' : 'circle',
      polygon: [],
      center: null,
      radius: 0
    };

    if (shapeType === window.google.maps.drawing.OverlayType.POLYGON) {
      const path = drawnShape.getPath();
      path.forEach(latLng => {
        data.polygon.push({
          lat: latLng.lat(),
          lng: latLng.lng()
        });
      });
    } else if (shapeType === window.google.maps.drawing.OverlayType.CIRCLE) {
      const center = drawnShape.getCenter();
      data.center = {
        lat: center.lat(),
        lng: center.lng()
      };
      data.radius = drawnShape.getRadius();
    }

    return data;
  };

  const handleSaveArea = async () => {
    if (!areaName.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    const shapeData = convertShapeToData();
    if (!shapeData) {
      toast.error('Invalid shape data');
      return;
    }

    const saveToast = toast.loading('Saving restricted area...');

    try {
      const result = await restrictedAreasService.saveRestrictedArea({
        name: areaName,
        description: areaDescription,
        riskLevel: areaRiskLevel,
        ...shapeData
      });

      if (result.success) {
        toast.dismiss(saveToast);
        toast.success('Restricted area created successfully!');
        
        // Clear form
        setShowModal(false);
        setAreaName('');
        setAreaDescription('');
        setAreaRiskLevel('medium');
        setDrawnShape(null);
        setShapeType(null);
        
        // Clear drawn shapes
        drawnShapesRef.current.forEach(shape => shape.setMap(null));
        drawnShapesRef.current = [];
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

  const renderRestrictedAreas = (areas) => {
    if (!map || !window.google) return;

    // Clear existing shapes
    drawnShapesRef.current.forEach(shape => {
      if (shape && shape.setMap) {
        shape.setMap(null);
      }
    });
    drawnShapesRef.current = [];

    // Render each area
    areas.forEach(area => {
      if (!visibleAreas[area.id]) return;

      try {
        if (area.type === 'polygon' && area.polygon && area.polygon.length > 0) {
          const polygonPath = area.polygon.map(point => ({
            lat: point.lat,
            lng: point.lng
          }));

          const polygon = new window.google.maps.Polygon({
            paths: polygonPath,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.2,
            map: map,
            editable: false,
            draggable: false
          });

          // Add click listener for info
          polygon.addListener('click', () => {
            showAreaInfo(area);
          });

          drawnShapesRef.current.push(polygon);
        } else if (area.type === 'circle' && area.center && area.radius) {
          const circle = new window.google.maps.Circle({
            center: {
              lat: area.center.lat,
              lng: area.center.lng
            },
            radius: area.radius,
            strokeColor: '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 0.2,
            map: map,
            editable: false,
            draggable: false
          });

          // Add click listener for info
          circle.addListener('click', () => {
            showAreaInfo(area);
          });

          drawnShapesRef.current.push(circle);
        }
      } catch (error) {
        console.error('Error rendering area:', area.name, error);
      }
    });
  };

  const showAreaInfo = (area) => {
    const infoContent = `
      <div style="padding: 10px; max-width: 250px;">
        <h3 style="margin: 0 0 8px 0; color: #ef4444; font-weight: bold;">${area.name}</h3>
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${area.description || 'No description'}</p>
        <div style="font-size: 12px; color: #666;">
          <div><strong>Type:</strong> ${area.type}</div>
          <div><strong>Risk Level:</strong> ${area.riskLevel}</div>
          ${area.type === 'circle' ? `<div><strong>Radius:</strong> ${(area.radius / 1000).toFixed(2)} km</div>` : ''}
        </div>
      </div>
    `;

    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent
    });

    if (area.type === 'circle' && area.center) {
      infoWindow.setPosition({
        lat: area.center.lat,
        lng: area.center.lng
      });
    }

    infoWindow.open(map);
  };

  const startDrawing = (mode) => {
    if (!drawingManager) {
      toast.error('Drawing manager not initialized');
      return;
    }

    const drawMode = mode === 'polygon' 
      ? window.google.maps.drawing.OverlayType.POLYGON 
      : window.google.maps.drawing.OverlayType.CIRCLE;

    drawingManager.setDrawingMode(drawMode);
    setDrawingMode(mode);
    toast.success(`Draw a ${mode} on the map`);
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
            <FiMapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Restricted Areas Manager</h3>
            <p className="text-sm text-gray-600">Create and manage geofenced restricted areas</p>
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

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => startDrawing('polygon')}
          disabled={drawingMode !== null}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            drawingMode === 'polygon'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          <FiMap className="w-4 h-4" />
          <span>Draw Polygon</span>
        </button>

        <button
          onClick={() => startDrawing('circle')}
          disabled={drawingMode !== null}
          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
            drawingMode === 'circle'
              ? 'bg-purple-600 text-white'
              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
          }`}
        >
          <FiCircle className="w-4 h-4" />
          <span>Draw Circle</span>
        </button>
      </div>

      {/* Map */}
      <div className="relative mb-4">
        <div
          ref={mapRef}
          style={{ height: '400px', width: '100%' }}
          className="bg-gray-100 rounded-lg"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <FiRefreshCw className="mx-auto text-4xl text-gray-400 mb-2 animate-spin" />
                <p className="text-gray-500">Loading map...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restricted Areas List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Active Restricted Areas ({restrictedAreas.length})</h4>
        
        {restrictedAreas.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            <FiAlertCircle className="mx-auto w-8 h-8 text-gray-400 mb-2" />
            <p>No restricted areas created yet. Draw one on the map to get started.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {restrictedAreas.map((area) => (
              <div
                key={area.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${getRiskLevelColor(area.riskLevel)}`}>
                    {area.type === 'polygon' ? (
                      <FiMap className="w-4 h-4" />
                    ) : (
                      <FiCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{area.name}</h5>
                    <p className="text-xs text-gray-600">
                      {area.type === 'circle' 
                        ? `Circle • ${(area.radius / 1000).toFixed(2)} km radius`
                        : `Polygon • ${area.polygon?.length || 0} points`
                      }
                    </p>
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

      {/* Modal for area name */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Restricted Area</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  drawnShapesRef.current.forEach(shape => shape.setMap(null));
                  drawnShapesRef.current = [];
                  setDrawnShape(null);
                  setShapeType(null);
                }}
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
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  placeholder="e.g., Downtown Market"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={areaDescription}
                  onChange={(e) => setAreaDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Level
                </label>
                <select
                  value={areaRiskLevel}
                  onChange={(e) => setAreaRiskLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Shape Type:</strong> {shapeType === window.google.maps.drawing.OverlayType.POLYGON ? 'Polygon' : 'Circle'}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  drawnShapesRef.current.forEach(shape => shape.setMap(null));
                  drawnShapesRef.current = [];
                  setDrawnShape(null);
                  setShapeType(null);
                }}
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

export default RestrictedAreasManager;
