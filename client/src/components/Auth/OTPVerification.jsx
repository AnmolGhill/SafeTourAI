import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthNotifications } from '../Notifications/NotificationHooks';
import { useNotifications } from '../Notifications';

const OTPVerification = () => {
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showAuthSuccess, showAuthError, showAuthInfo } = useAuthNotifications();
  const { notify } = useNotifications();
  const showError = (message) => notify.error('Error', message);
  const showSuccess = (message) => notify.success('Success', message);
  const showInfo = (message) => notify.info('Info', message);

  useEffect(() => {
    // Get email from navigation state or localStorage
    const stateEmail = location.state?.email;
    const storedData = localStorage.getItem('otpVerificationData');
    
    if (stateEmail) {
      setEmail(stateEmail);
    } else if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setEmail(parsed.email || '');
      } catch (error) {
        console.error('Error parsing stored OTP data:', error);
      }
    }

    // Start timer
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [location.state]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showError('Please enter your email');
      return;
    }
    
    if (otp.length !== 6) {
      showError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      showAuthInfo('Verifying OTP...');
      
      // Direct API call to backend
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        showAuthSuccess('Email verified successfully!');
        
        // Firebase client-side auth is disabled - using backend-only authentication
        console.log('🔑 Using backend-only authentication - Firebase client disabled');
        
        // Store user data in localStorage
        localStorage.setItem('userData', JSON.stringify(result.user));
        localStorage.setItem('token', result.token);
        
        // Navigate based on role with a small delay to ensure localStorage is set
        setTimeout(() => {
          const userRole = result.user.role;
          switch (userRole) {
            case 'admin':
              navigate('/dashboard/admin', { replace: true });
              break;
            case 'subadmin':
              navigate('/dashboard/sub-admin', { replace: true });
              break;
            default:
              navigate('/dashboard-user', { replace: true });
              break;
          }
        }, 100);
      } else {
        throw new Error(result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      showAuthError(error.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      showError('Please enter your email first');
      return;
    }

    setIsLoading(true);

    try {
      showAuthInfo('Sending new OTP...');
      
      // Direct API call to backend
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim()
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        showAuthSuccess('New OTP sent successfully!');
        setTimer(300);
        setCanResend(false);
        setOtp('');
      } else {
        throw new Error(result.message || 'Failed to resend OTP');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      showAuthError(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Verify Your Email</h2>
          <p className="text-gray-600 mt-2">
            Enter your email and the 6-digit verification code
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              className="w-full px-4 py-3 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              placeholder="000000"
            />
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Timer and Resend OTP */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              {timer > 0 ? `Resend available in ${formatTime(timer)}` : "Didn't receive the code?"}
            </p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading || !canResend}
              className={`text-sm font-medium transition duration-200 ${
                isLoading || !canResend
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>

        {/* Back to Register */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/register')}
            className="text-sm text-gray-600 hover:text-gray-800 transition duration-200"
          >
            ← Back to Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default OTPVerification;
