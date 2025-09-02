// Firebase is completely disabled for frontend - using backend-only authentication
// All Firebase functionality is handled by the backend server

console.log('🚫 Firebase disabled - frontend uses backend-only authentication');

// Export null values to maintain compatibility with existing imports
export const auth = null;
export const db = null;
export const storage = null;
export default null;
