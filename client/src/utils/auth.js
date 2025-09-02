// Simple authentication utility functions
export const useAuth = () => {
  // Check authentication from localStorage
  const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('userData');
    return !!(token && userData);
  };

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  return {
    isAuthenticated: isAuthenticated(),
    user: getCurrentUser(),
    token: getAuthToken(),
    logout
  };
};

export default useAuth;
