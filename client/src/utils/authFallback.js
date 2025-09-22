// Authentication utility - backend-only implementation
import backendAuthService from '../services/backendAuthService';

// Firebase is completely disabled - always use backend authentication
export const isFirebaseConfigured = () => {
  return false; // Always false since we're using backend-only auth
};

// Always return backend auth service
export const getAuthService = () => {
  console.info('Using backend-only authentication');
  return Promise.resolve(backendAuthService);
};

export default {
  isFirebaseConfigured,
  getAuthService
};
