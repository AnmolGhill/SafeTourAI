import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiMail, FiLock } from 'react-icons/fi';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { auth } from '../../config/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentUser } = useAuth();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error('Please enter both email and password', {
        position: 'top-center',
        duration: 4000
      });
      return;
    }

    setIsSubmitting(true);
    // Clear any existing toasts and show single loading message
    toast.dismiss();
    const loadingToast = toast.loading('Signing you in...', {
      position: 'top-center'
    });

    try {
      // Call backend login endpoint
      const BASE_URL = import.meta.env.VITE_BASE_URL;
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password
        }),
        credentials: 'include'
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login failed');
      }

      // Store authentication data
      localStorage.setItem('token', result.token);
      localStorage.setItem('userData', JSON.stringify(result.user));
      
      // Sign in with Firebase custom token if available - REQUIRED for last login tracking
      if (result.customToken && auth) {
        try {
          const userCredential = await signInWithCustomToken(auth, result.customToken);
          console.log('✅ Firebase Auth sign-in successful - Last login tracked', {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            lastSignIn: userCredential.user.metadata.lastSignInTime,
            creationTime: userCredential.user.metadata.creationTime
          });
          
          // Update auth context with Firebase user
          setCurrentUser({
            ...result.user,
            uid: userCredential.user.uid,
            firebaseUser: userCredential.user
          });
          
          // Force refresh Firebase user to ensure latest metadata
          await userCredential.user.reload();
          console.log('🔄 Firebase user metadata refreshed for console tracking');
          
        } catch (firebaseError) {
          console.error('❌ Firebase Auth sign-in FAILED - Last login will NOT be tracked:', firebaseError);
          console.error('Firebase Error Details:', {
            code: firebaseError.code,
            message: firebaseError.message,
            customToken: result.customToken ? 'Present' : 'Missing'
          });
          
          // This is critical for login tracking - show error to user
          toast.error('Login successful but tracking failed. Please contact support if this persists.', {
            position: 'top-center',
            duration: 3000
          });
        }
      } else {
        console.warn('⚠️ Custom token or Firebase auth missing - Last login will NOT be tracked');
        console.warn('Debug info:', {
          hasCustomToken: !!result.customToken,
          hasFirebaseAuth: !!auth,
          customTokenLength: result.customToken?.length || 0
        });
      }
      
      // Dismiss loading toast and show brief success message
      toast.dismiss();
      toast.success('Login successful!', {
        position: 'top-center',
        duration: 2000
      });
      
      // Handle redirect based on user role
      const redirectPath = location.state?.from?.pathname || 
        (result.user?.role === 'admin' ? '/dashboard/admin' : 
         result.user?.role === 'subadmin' ? '/dashboard/sub-admin' : 
         '/dashboard-user');
      
      // Navigate after a brief delay to show success message
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      toast.dismiss();
      toast.error(error.message || 'Login failed. Please check your credentials and try again.', {
        position: 'top-center',
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">ST</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your SafeTourAI account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 transition duration-200"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Please wait...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-800 font-medium transition duration-200"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
