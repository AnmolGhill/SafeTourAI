import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw, FiX, FiCheck, FiMapPin, FiEye, FiEyeOff } from 'react-icons/fi';
import { restrictedAreasService } from '../../services/restrictedAreasService';
import toast from 'react-hot-toast';

const SimpleRestrictedAreas = () => {
  const [restrictedAreas, setRestrictedAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [visibleAreas, setVisibleAreas] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    riskLevel: 'medium',
    type: 'circle',
    latitude: 26.1445,
    longitude: 91.7362,
    radius: 500
  });

  // Load restricted areas
  useEffect(() => {
    loadRestrictedAreas();
  }, []);

  const loadRestrictedAreas = async () => {
    try {
      setLoading(true);
      const unsubscribe = restrictedAreasService.listenToRestrictedAreas((areas) => {
        setRestrictedAreas(areas);
        
        // Initialize visibility state
        const visibilityState = {};
        areas.forEach(area => {
          visibilityState[area.id] = true;
        });
        setVisibleAreas(visibilityState);
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Error loading restricted areas:', error);
      toast.error('Failed to load restricted areas');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' || name === 'radius' 
        ? parseFloat(value) 
        : value
    }));
  };

  const handleSaveArea = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter an area name');
      return;
    }

    const saveToast = toast.loading('Saving restricted area...');

    try {
      const areaData = {
        name: formData.name,
        description: formData.description,
        riskLevel: formData.riskLevel,
        type: formData.type
      };

      if (formData.type === 'circle') {
        areaData.center = {
          lat: formData.latitude,
          lng: formData.longitude
        };
        areaData.radius = formData.radius;
      } else {
        // For polygon, we'll use a simple square around the center point
        const latOffset = 0.01;
        const lngOffset = 0.01;
        areaData.polygon = [
          { lat: formData.latitude - latOffset, lng: formData.longitude - lngOffset },
          { lat: formData.latitude + latOffset, lng: formData.longitude - lngOffset },
          { lat: formData.latitude + latOffset, lng: formData.longitude + lngOffset },
          { lat: formData.latitude - latOffset, lng: formData.longitude + lngOffset }
        ];
      }

      const result = await restrictedAreasService.saveRestrictedArea(areaData);

      if (result.success) {
        toast.dismiss(saveToast);
        toast.success('Restricted area created successfully!');
        
        // Reset form
        setShowModal(false);
        setFormData({
          name: '',
          description: '',
          riskLevel: 'medium',
          type: 'circle',
          latitude: 26.1445,
          longitude: 91.7362,
          radius: 500
        });
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
            <h3 className="text-lg font-semibold text-gray-800">Restricted Areas</h3>
            <p className="text-sm text-gray-600">Create and manage geofenced restricted areas for users</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Area</span>
        </button>
      </div>

      {/* Restricted Areas List */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-800">Active Restricted Areas ({restrictedAreas.length})</h4>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <FiRefreshCw className="mx-auto w-8 h-8 animate-spin mb-2" />
            <p>Loading restricted areas...</p>
          </div>
        ) : restrictedAreas.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-600">
            <FiMapPin className="mx-auto w-8 h-8 text-gray-400 mb-2" />
            <p>No restricted areas created yet. Click "Add Area" to create one.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
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

      {/* Modal for creating area */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Create Restricted Area</h3>
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
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Paltan Bazaar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional description..."
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="circle">Circle</option>
                    <option value="polygon">Polygon</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Risk Level
                  </label>
                  <select
                    name="riskLevel"
                    value={formData.riskLevel}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    step="0.0001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formData.type === 'circle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius (meters)
                  </label>
                  <input
                    type="number"
                    name="radius"
                    value={formData.radius}
                    onChange={handleInputChange}
                    min="100"
                    step="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
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

export default SimpleRestrictedAreas;
