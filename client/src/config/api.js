// Get base URL from environment variables and append /api
const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
const API_BASE_URL = `${BASE_URL}/api`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to get auth headers for file uploads
const getFileUploadHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// KYC API
export const kycAPI = {
  async submit(formData) {
    try {
      const response = await fetch(`${API_BASE_URL}/kyc/submit`, {
        method: 'POST',
        headers: getFileUploadHeaders(),
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { 
        data: {
          success: true,
          message: result.message,
          status: result.status,
          submittedAt: result.submittedAt
        }
      };
    } catch (error) {
      console.error('KYC submit error:', error);
      throw error;
    }
  },

  async getStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/kyc/status`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { 
        data: {
          success: true,
          data: {
            kycStatus: result.status,
            blockchainId: result.blockchainId,
            submittedAt: result.submittedAt,
            reviewedAt: result.reviewedAt,
            rejectionReason: result.rejectionReason
          }
        }
      };
    } catch (error) {
      console.error('KYC status error:', error);
      // Return default status for new users
      return {
        data: {
          success: true,
          data: {
            kycStatus: 'not_submitted',
            blockchainId: null
          }
        }
      };
    }
  }
};

// Users API
export const usersAPI = {
  async getResponders(params) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/user/responders?${queryString}`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      return { data: result.data || [] };
    } catch (error) {
      console.error('Get responders error:', error);
      // Return mock data for demo
      return {
        data: [
          {
            userId: 'resp-1',
            name: 'Officer Smith',
            role: 'Police Officer',
            phone: '+1234567890',
            isActive: true,
            location: { coordinates: [0, 0] }
          }
        ]
      };
    }
  },

  async getProfile() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      return { data: result.data };
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      const result = await response.json();
      return { data: result.data };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }
};

// Emergency API
export const emergencyAPI = {
  async create(emergencyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(emergencyData)
      });

      const result = await response.json();
      return { data: result.data };
    } catch (error) {
      console.error('Create emergency error:', error);
      throw error;
    }
  },

  async getNearby(latitude, longitude, radius) {
    try {
      const response = await fetch(`${API_BASE_URL}/emergency/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, {
        headers: getAuthHeaders()
      });

      const result = await response.json();
      return { data: result.data || [] };
    } catch (error) {
      console.error('Get nearby emergencies error:', error);
      return { data: [] };
    }
  }
};

// Admin API for KYC management
export const adminAPI = {
  async getPendingKYCs() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/kyc/admin/pending`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result.applications || [] };
    } catch (error) {
      console.error('Get pending KYCs error:', error);
      throw error;
    }
  },

  async reviewKYC(uid, action, rejectionReason = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/kyc/${uid}/review`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          rejectionReason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Review KYC error:', error);
      throw error;
    }
  },

  async getKYCStats() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/kyc/admin/stats`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result.stats };
    } catch (error) {
      console.error('Get KYC stats error:', error);
      throw error;
    }
  },

  async getKYCDocuments(uid) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/kyc/admin/documents/${uid}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed - please login again');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Get KYC documents error:', error);
      throw error;
    }
  }
};

// Utility function to download KYC documents
export const downloadKYCDocument = async (documentUrl, fileName) => {
  try {
    if (documentUrl.startsWith('data:')) {
      // Handle base64 data URLs
      const link = document.createElement('a');
      link.href = documentUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Handle regular URLs
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

export default {
  kycAPI,
  usersAPI,
  emergencyAPI,
  adminAPI
};
