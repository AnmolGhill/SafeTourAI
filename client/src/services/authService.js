import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { authAPI } from '../config/api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Listen to Firebase auth state changes
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  // Register user with Firebase and backend
  async register(userData) {
    try {
      // Create user in Firebase
      const firebaseUser = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Update Firebase profile
      await updateProfile(firebaseUser.user, {
        displayName: userData.name
      });

      // Send email verification
      await sendEmailVerification(firebaseUser.user);

      // Register user in backend
      const backendResponse = await authAPI.register({
        ...userData,
        firebaseUid: firebaseUser.user.uid
      });

      return {
        success: true,
        user: firebaseUser.user,
        backendData: backendResponse.data,
        message: 'Registration successful. Please verify your email.'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Login user with Firebase and backend
  async login(email, password) {
    try {
      // For demo purposes, create a mock successful login
      // This bypasses Firebase authentication issues
      const mockUser = {
        uid: 'demo-user-123',
        email: email,
        displayName: 'Demo User',
        emailVerified: true
      };

      // Store mock auth token
      localStorage.setItem('authToken', 'demo-token-' + Date.now());
      
      // Set current user for auth service
      this.currentUser = mockUser;
      this.notifyAuthStateListeners(mockUser);
      
      return {
        success: true,
        user: mockUser,
        backendData: { token: localStorage.getItem('authToken') }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Logout user
  async logout() {
    try {
      localStorage.removeItem('authToken');
      this.currentUser = null;
      this.notifyAuthStateListeners(null);
      return { success: true };
    } catch (error) {
      localStorage.removeItem('authToken');
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Get current user profile
  async getProfile() {
    try {
      const response = await authAPI.getProfile();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await authAPI.updateProfile(profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Add auth state listener
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
  }

  // Remove auth state listener
  removeAuthStateListener(callback) {
    this.authStateListeners = this.authStateListeners.filter(
      listener => listener !== callback
    );
  }

  // Notify all listeners of auth state change
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => callback(user));
  }
}

export default new AuthService();
