import { useState, useEffect } from 'react';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthenticated(!!firebaseUser && authService.isAuthenticated());
      setLoading(false);
    });

    return () => {
      authService.removeAuthStateListener(unsubscribe);
    };
  }, []);

  return {
    user,
    loading,
    isAuthenticated
  };
};
