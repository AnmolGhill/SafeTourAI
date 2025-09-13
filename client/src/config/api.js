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
    'Accept': 'application/json',
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
      console.log('Fetching KYC status from:', `${API_BASE_URL}/user/kyc-status`);
      const response = await fetch(`${API_BASE_URL}/user/kyc-status`, {
        headers: getAuthHeaders()
      });

      console.log('KYC Status Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('KYC Status Error Response:', errorText);
        
        // Check if response is HTML (server error page)
        if (errorText.includes('<!doctype html>') || errorText.includes('<html')) {
          console.error('Server returned HTML instead of JSON - possible server configuration issue');
          throw new Error('Server configuration error - received HTML instead of JSON');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response received:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();
      return { 
        data: {
          success: true,
          data: {
            kycStatus: result.kycStatus,
            blockchainId: result.blockchainId,
            verificationLevel: result.verificationLevel,
            digitalIdActive: result.digitalIdActive,
            digitalIdCreated: result.digitalIdCreated,
            securityScore: result.securityScore,
            securityLevel: result.securityLevel,
            emergencyContactsCount: result.emergencyContactsCount,
            emergencyContactsConfigured: result.emergencyContactsConfigured,
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
            kycStatus: 'not_started',
            blockchainId: null,
            digitalIdActive: false,
            securityScore: 0,
            emergencyContactsCount: 0
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

// Blockchain API
export const blockchainAPI = {
  async getDigitalID() {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/digital-id`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Get digital ID error:', error);
      throw error;
    }
  },

  async getQRCodeData() {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/digital-id/qr`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Get QR code data error:', error);
      throw error;
    }
  },

  async verifyBlockchainID(blockchainId) {
    try {
      const response = await fetch(`${API_BASE_URL}/blockchain/verify`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blockchainId })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Verify blockchain ID error:', error);
      throw error;
    }
  }
};

// Wallet API
export const walletAPI = {
  async createWallet() {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/create`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Create wallet error:', error);
      throw error;
    }
  },

  async getTransactions() {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/transactions`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Get transactions error:', error);
      throw error;
    }
  },

  async refreshBalance() {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/refresh-balance`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Refresh balance error:', error);
      throw error;
    }
  },

  async getSeedPhrase() {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/seed-phrase`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Get seed phrase error:', error);
      throw error;
    }
  },

  async sendTransaction(toAddress, amount) {
    try {
      const response = await fetch(`${API_BASE_URL}/wallet/send`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ toAddress, amount })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { data: result };
    } catch (error) {
      console.error('Send transaction error:', error);
      throw error;
    }
  }
};

export default {
  kycAPI,
  usersAPI,
  emergencyAPI,
  adminAPI,
  blockchainAPI,
  walletAPI
};
