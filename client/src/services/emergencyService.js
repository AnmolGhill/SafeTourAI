import { emergencyAPI } from '../config/api';
import notificationService from './notificationService';

class EmergencyService {
  constructor() {
    this.activeEmergencies = [];
    this.listeners = [];
  }

  // Create new emergency
  async createEmergency(emergencyData) {
    try {
      const response = await emergencyAPI.create(emergencyData);
      
      // Notify listeners
      this.notifyListeners('emergency_created', response.data);
      
      // Send push notification
      await notificationService.sendLocalNotification(
        'Emergency Created',
        `Emergency ${response.data.emergencyId} has been created`
      );

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get all emergencies
  async getEmergencies(filters = {}) {
    try {
      const response = await emergencyAPI.getAll(filters);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get emergency by ID
  async getEmergencyById(id) {
    try {
      const response = await emergencyAPI.getById(id);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get nearby emergencies
  async getNearbyEmergencies(latitude, longitude, radius = 5000) {
    try {
      const response = await emergencyAPI.getNearby({
        latitude,
        longitude,
        radius
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get active emergencies
  async getActiveEmergencies() {
    try {
      const response = await emergencyAPI.getActive();
      this.activeEmergencies = response.data;
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Update emergency status
  async updateEmergencyStatus(id, status) {
    try {
      const response = await emergencyAPI.updateStatus(id, status);
      
      // Notify listeners
      this.notifyListeners('emergency_updated', response.data);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Assign responder to emergency
  async assignResponder(emergencyId, responderId) {
    try {
      const response = await emergencyAPI.assignResponder(emergencyId, responderId);
      
      // Notify listeners
      this.notifyListeners('responder_assigned', response.data);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Upload media to emergency
  async uploadMedia(emergencyId, file, mediaType) {
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('type', mediaType);
      
      const response = await emergencyAPI.addMedia(emergencyId, formData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get emergency statistics
  async getStatistics(startDate, endDate) {
    try {
      const response = await emergencyAPI.getStatistics({
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get user's current location
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          reject(new Error(`Location error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Quick SOS - Create emergency with current location
  async quickSOS(type = 'other', description = '') {
    try {
      const location = await this.getCurrentLocation();
      
      const emergencyData = {
        type,
        description,
        severity: 'high',
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude]
        }
      };

      return await this.createEmergency(emergencyData);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Add listener for emergency events
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }
}

export default new EmergencyService();
