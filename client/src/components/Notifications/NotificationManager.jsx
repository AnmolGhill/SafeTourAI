import React from 'react';
import toast from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/solid';

// Custom Toast Components
const CustomToast = ({ type, title, message, icon: Icon }) => (
  <div className="flex items-start space-x-3 p-1">
    <div className={`flex-shrink-0 w-6 h-6 ${getIconColor(type)}`}>
      <Icon className="w-full h-full" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 mb-1">{title}</p>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

const getIconColor = (type) => {
  switch (type) {
    case 'success': return 'text-green-500';
    case 'error': return 'text-red-500';
    case 'warning': return 'text-yellow-500';
    case 'info': return 'text-blue-500';
    default: return 'text-gray-500';
  }
};

// Notification Manager Class
class NotificationManager {
  // Success notifications
  static success(title, message = '', options = {}) {
    // Auto-dismiss previous notifications of same type
    toast.dismiss();
    
    return toast(
      (t) => (
        <CustomToast 
          type="success" 
          title={title} 
          message={message} 
          icon={CheckCircleIcon} 
        />
      ),
      {
        duration: 3000,
        icon: null, // Disable default icon
        style: {
          background: '#f0f9ff',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        ...options
      }
    );
  }

  // Error notifications
  static error(title, message = '', options = {}) {
    // Auto-dismiss previous notifications
    toast.dismiss();
    
    return toast(
      (t) => (
        <CustomToast 
          type="error" 
          title={title} 
          message={message} 
          icon={XCircleIcon} 
        />
      ),
      {
        duration: 5000,
        icon: null, // Disable default icon
        style: {
          background: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        ...options
      }
    );
  }

  // Warning notifications
  static warning(title, message = '', options = {}) {
    // Auto-dismiss previous notifications
    toast.dismiss();
    
    return toast(
      (t) => (
        <CustomToast 
          type="warning" 
          title={title} 
          message={message} 
          icon={ExclamationTriangleIcon} 
        />
      ),
      {
        duration: 4000,
        icon: null, // Disable default icon
        style: {
          background: '#fffbeb',
          border: '1px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        ...options
      }
    );
  }

  // Info notifications
  static info(title, message = '', options = {}) {
    // Auto-dismiss previous notifications
    toast.dismiss();
    
    return toast(
      (t) => (
        <CustomToast 
          type="info" 
          title={title} 
          message={message} 
          icon={InformationCircleIcon} 
        />
      ),
      {
        duration: 3500,
        icon: null, // Disable default icon
        style: {
          background: '#f0f9ff',
          border: '1px solid #3b82f6',
          borderRadius: '12px',
          padding: '16px 20px',
        },
        ...options
      }
    );
  }

  // Loading notification with promise
  static loading(promise, messages = {}) {
    const defaultMessages = {
      loading: 'Processing...',
      success: 'Operation completed successfully!',
      error: 'Operation failed. Please try again.'
    };

    const finalMessages = { ...defaultMessages, ...messages };

    return toast.promise(
      promise,
      {
        loading: (
          <CustomToast 
            type="info" 
            title={finalMessages.loading} 
            message="" 
            icon={InformationCircleIcon} 
          />
        ),
        success: (data) => (
          <CustomToast 
            type="success" 
            title={finalMessages.success} 
            message={data?.message || ''} 
            icon={CheckCircleIcon} 
          />
        ),
        error: (error) => (
          <CustomToast 
            type="error" 
            title={finalMessages.error} 
            message={error?.message || ''} 
            icon={XCircleIcon} 
          />
        ),
      },
      {
        style: {
          borderRadius: '8px',
          padding: '16px',
        }
      }
    );
  }

  // Dismiss all notifications
  static dismissAll() {
    toast.dismiss();
  }

  // Dismiss specific notification
  static dismiss(toastId) {
    toast.dismiss(toastId);
  }

  // Custom loading toast
  static customLoading(message = 'Loading...') {
    return toast.loading(message, {
      style: {
        background: '#f0f9ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
      }
    });
  }

  // Remove loading toast and show success
  static removeAndSuccess(toastId, title, message = '') {
    toast.dismiss(toastId);
    return this.success(title, message);
  }

  // Remove loading toast and show error
  static removeAndError(toastId, title, message = '') {
    toast.dismiss(toastId);
    return this.error(title, message);
  }
}

// Predefined notification types for SafeTourAI
export const SafeTourNotifications = {
  // Authentication notifications
  auth: {
    loginSuccess: () => NotificationManager.success(
      'Welcome back!', 
      'You have successfully logged in to SafeTourAI.'
    ),
    loginError: (error) => NotificationManager.error(
      'Login Failed', 
      error || 'Please check your credentials and try again.'
    ),
    logoutSuccess: () => NotificationManager.info(
      'Logged Out', 
      'You have been successfully logged out.'
    ),
    registrationSuccess: () => NotificationManager.success(
      'Registration Successful!', 
      'Please verify your email to complete the process.'
    ),
    otpSent: () => NotificationManager.info(
      'OTP Sent', 
      'Please check your email for the verification code.'
    ),
    otpVerified: () => NotificationManager.success(
      'Email Verified!', 
      'Your account has been successfully verified.'
    )
  },

  // KYC notifications
  kyc: {
    submitted: () => NotificationManager.info(
      'KYC Submitted', 
      'Your documents are under review. We\'ll notify you once verified.'
    ),
    approved: () => NotificationManager.success(
      'KYC Approved!', 
      'Your identity has been verified successfully.'
    ),
    rejected: (reason) => NotificationManager.error(
      'KYC Rejected', 
      reason || 'Please resubmit your documents with correct information.'
    ),
    documentsUploaded: () => NotificationManager.success(
      'Documents Uploaded', 
      'Your KYC documents have been uploaded successfully.'
    )
  },

  // Emergency notifications
  emergency: {
    alertSent: () => NotificationManager.warning(
      'Emergency Alert Sent!', 
      'Your emergency request has been sent to nearby responders.'
    ),
    responderAssigned: (responderName) => NotificationManager.info(
      'Responder Assigned', 
      `${responderName} is on the way to assist you.`
    ),
    emergencyResolved: () => NotificationManager.success(
      'Emergency Resolved', 
      'The emergency situation has been marked as resolved.'
    )
  },

  // System notifications
  system: {
    profileUpdated: () => NotificationManager.success(
      'Profile Updated', 
      'Your profile information has been saved successfully.'
    ),
    settingsSaved: () => NotificationManager.success(
      'Settings Saved', 
      'Your preferences have been updated.'
    ),
    dataSync: () => NotificationManager.info(
      'Syncing Data', 
      'Your data is being synchronized with the blockchain.'
    ),
    connectionLost: () => NotificationManager.warning(
      'Connection Lost', 
      'Please check your internet connection.'
    ),
    connectionRestored: () => NotificationManager.success(
      'Connection Restored', 
      'You are back online.'
    )
  },

  // Blockchain notifications
  blockchain: {
    transactionPending: () => NotificationManager.info(
      'Transaction Pending', 
      'Your blockchain transaction is being processed.'
    ),
    transactionConfirmed: (txHash) => NotificationManager.success(
      'Transaction Confirmed', 
      `Transaction ${txHash?.slice(0, 10)}... has been confirmed.`
    ),
    transactionFailed: () => NotificationManager.error(
      'Transaction Failed', 
      'Your blockchain transaction could not be completed.'
    )
  },

  // QR Scanner notifications
  scanner: {
    scanSuccess: () => NotificationManager.success(
      'QR Code Scanned', 
      'Tourist information retrieved successfully.'
    ),
    scanError: () => NotificationManager.error(
      'Scan Failed', 
      'Could not read the QR code. Please try again.'
    ),
    invalidCode: () => NotificationManager.warning(
      'Invalid QR Code', 
      'This QR code is not recognized by SafeTourAI.'
    )
  }
};

export default NotificationManager;
