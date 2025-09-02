import React, { createContext, useContext, useCallback } from 'react';
import { Toaster } from 'react-hot-toast';
import NotificationManager, { SafeTourNotifications } from './NotificationManager';
import './NotificationStyles.css';

// Create notification context
const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  // Wrapper functions for easier usage
  const notify = {
    success: (title, message, options) => NotificationManager.success(title, message, options),
    error: (title, message, options) => NotificationManager.error(title, message, options),
    warning: (title, message, options) => NotificationManager.warning(title, message, options),
    info: (title, message, options) => NotificationManager.info(title, message, options),
    loading: (promise, messages) => NotificationManager.loading(promise, messages),
    dismiss: (toastId) => NotificationManager.dismiss(toastId),
    dismissAll: () => NotificationManager.dismissAll(),
  };

  // SafeTourAI specific notifications
  const safeTourNotify = SafeTourNotifications;

  const contextValue = {
    notify,
    safeTourNotify,
    // Direct access to NotificationManager
    NotificationManager
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={12}
        containerClassName="custom-toast-container"
        containerStyle={{
          top: 20,
          left: 16,
          right: 16,
        }}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '16px 20px',
            fontSize: '14px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          // Default options for specific types
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            duration: Infinity,
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
