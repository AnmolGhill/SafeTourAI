/**
 * Geofencing Integration Module
 * Integrates real-time geofencing with Google Maps for user dashboard
 * 
 * Usage in your map component:
 * 
 * import { initGeofencing, cleanupGeofencing } from '../../utils/geofencingIntegration';
 * 
 * // In useEffect:
 * const cleanup = initGeofencing(map, restrictedAreas, {
 *   onEnterArea: (area) => console.log('Entered:', area.name),
 *   onExitArea: (area) => console.log('Exited:', area.name),
 *   updateInterval: 5000
 * });
 * 
 * // In cleanup:
 * return () => cleanup();
 */

import { geofencingService } from '../services/geofencingService';

let geofencingState = {
  map: null,
  restrictedAreas: [],
  userLocation: null,
  watchId: null,
  userInAreas: new Set(),
  updateInterval: 5000,
  callbacks: {},
  drawnShapes: [],
  isActive: false
};

/**
 * Initialize geofencing on the map
 * @param {google.maps.Map} map - Google Map instance
 * @param {Array} restrictedAreas - Array of restricted area objects
 * @param {Object} options - Configuration options
 * @returns {Function} Cleanup function
 */
export const initGeofencing = (map, restrictedAreas = [], options = {}) => {
  if (!map || !window.google) {
    console.error('Map or Google Maps not available for geofencing');
    return () => {};
  }

  // Initialize state
  geofencingState.map = map;
  geofencingState.restrictedAreas = restrictedAreas;
  geofencingState.callbacks = {
    onEnterArea: options.onEnterArea || (() => {}),
    onExitArea: options.onExitArea || (() => {}),
    onLocationUpdate: options.onLocationUpdate || (() => {})
  };
  geofencingState.updateInterval = options.updateInterval || 5000;
  geofencingState.isActive = true;

  // Render initial restricted areas on map
  renderRestrictedAreas(restrictedAreas);

  // Start location tracking
  startLocationTracking();

  // Return cleanup function
  return () => cleanupGeofencing();
};

/**
 * Update restricted areas in real-time
 * @param {Array} restrictedAreas - Updated array of restricted areas
 */
export const updateRestrictedAreas = (restrictedAreas) => {
  geofencingState.restrictedAreas = restrictedAreas;
  
  // Clear and redraw shapes
  clearDrawnShapes();
  renderRestrictedAreas(restrictedAreas);

  // Check current location against new areas
  if (geofencingState.userLocation) {
    checkGeofence(geofencingState.userLocation);
  }
};

/**
 * Render restricted areas on the map
 * @param {Array} restrictedAreas - Array of restricted area objects
 */
const renderRestrictedAreas = (restrictedAreas) => {
  if (!geofencingState.map || !window.google) return;

  clearDrawnShapes();

  restrictedAreas.forEach(area => {
    if (!area.active) return;

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
          fillOpacity: 0.15,
          map: geofencingState.map,
          editable: false,
          draggable: false
        });

        // Add info window on click
        polygon.addListener('click', () => {
          showAreaInfo(area);
        });

        geofencingState.drawnShapes.push(polygon);
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
          fillOpacity: 0.15,
          map: geofencingState.map,
          editable: false,
          draggable: false
        });

        // Add info window on click
        circle.addListener('click', () => {
          showAreaInfo(area);
        });

        geofencingState.drawnShapes.push(circle);
      }
    } catch (error) {
      console.error('Error rendering restricted area:', area.name, error);
    }
  });
};

/**
 * Show area information in an info window
 * @param {Object} area - Restricted area object
 */
const showAreaInfo = (area) => {
  const infoContent = `
    <div style="padding: 10px; max-width: 250px; font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 8px 0; color: #ef4444; font-weight: bold; font-size: 14px;">
        ⚠️ ${area.name}
      </h3>
      <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">
        ${area.description || 'Restricted area'}
      </p>
      <div style="font-size: 11px; color: #666; line-height: 1.6;">
        <div><strong>Type:</strong> ${area.type === 'polygon' ? 'Polygon' : 'Circle'}</div>
        <div><strong>Risk Level:</strong> <span style="color: ${getRiskLevelColor(area.riskLevel)}">${area.riskLevel.toUpperCase()}</span></div>
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

  infoWindow.open(geofencingState.map);
};

/**
 * Get risk level color for display
 * @param {string} level - Risk level (low, medium, high)
 * @returns {string} Color code
 */
const getRiskLevelColor = (level) => {
  switch (level) {
    case 'high': return '#ef4444';
    case 'medium': return '#f97316';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
};

/**
 * Start continuous location tracking
 */
const startLocationTracking = () => {
  geofencingState.watchId = geofencingService.startGeofencingWatch(
    (location) => {
      geofencingState.userLocation = location;
      geofencingState.callbacks.onLocationUpdate(location);
      checkGeofence(location);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

/**
 * Check if user is in any restricted areas
 * @param {Object} userLocation - User's current location {lat, lng}
 */
const checkGeofence = (userLocation) => {
  const areasInside = geofencingService.checkRestrictedAreas(
    userLocation,
    geofencingState.restrictedAreas
  );

  const currentAreaIds = new Set(areasInside.map(a => a.id));

  // Check for entered areas
  areasInside.forEach(area => {
    if (!geofencingState.userInAreas.has(area.id)) {
      geofencingState.userInAreas.add(area.id);
      geofencingState.callbacks.onEnterArea(area);
      
      // Visual feedback
      showEnterAreaNotification(area);
    }
  });

  // Check for exited areas
  geofencingState.userInAreas.forEach(areaId => {
    if (!currentAreaIds.has(areaId)) {
      geofencingState.userInAreas.delete(areaId);
      const area = geofencingState.restrictedAreas.find(a => a.id === areaId);
      if (area) {
        geofencingState.callbacks.onExitArea(area);
        showExitAreaNotification(area);
      }
    }
  });
};

/**
 * Show notification when entering a restricted area
 * @param {Object} area - Restricted area object
 */
const showEnterAreaNotification = (area) => {
  // Create a visual notification on the map
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">⚠️ Entering Restricted Area</div>
    <div style="font-size: 14px;">${area.name}</div>
    <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">${area.description || 'Please exercise caution'}</div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
};

/**
 * Show notification when exiting a restricted area
 * @param {Object} area - Restricted area object
 */
const showExitAreaNotification = (area) => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #22c55e;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-family: Arial, sans-serif;
    max-width: 300px;
  `;
  
  notification.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 4px;">✓ Left Restricted Area</div>
    <div style="font-size: 14px;">${area.name}</div>
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

/**
 * Clear all drawn shapes from the map
 */
const clearDrawnShapes = () => {
  geofencingState.drawnShapes.forEach(shape => {
    if (shape && shape.setMap) {
      try {
        shape.setMap(null);
      } catch (error) {
        console.warn('Error clearing shape:', error);
      }
    }
  });
  geofencingState.drawnShapes = [];
};

/**
 * Cleanup geofencing - stop tracking and clear map
 */
export const cleanupGeofencing = () => {
  if (!geofencingState.isActive) return;

  // Stop location tracking
  if (geofencingState.watchId !== null) {
    geofencingService.stopGeofencingWatch(geofencingState.watchId);
  }

  // Clear drawn shapes
  clearDrawnShapes();

  // Reset state
  geofencingState = {
    map: null,
    restrictedAreas: [],
    userLocation: null,
    watchId: null,
    userInAreas: new Set(),
    updateInterval: 5000,
    callbacks: {},
    drawnShapes: [],
    isActive: false
  };
};

/**
 * Get current geofencing state (for debugging)
 * @returns {Object} Current state
 */
export const getGeofencingState = () => {
  return {
    isActive: geofencingState.isActive,
    userLocation: geofencingState.userLocation,
    userInAreas: Array.from(geofencingState.userInAreas),
    restrictedAreasCount: geofencingState.restrictedAreas.length
  };
};
