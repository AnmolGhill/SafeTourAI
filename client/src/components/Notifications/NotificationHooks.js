import { useCallback } from 'react';
import { useAuth } from '../../utils/auth';
import { useNotifications } from './NotificationProvider';

// Custom hooks for specific notification types
export const useAuthNotifications = () => {
  const { safeTourNotify, notify } = useNotifications();
  
  return {
    loginSuccess: useCallback(() => safeTourNotify.auth.loginSuccess(), [safeTourNotify]),
    loginError: useCallback((error) => safeTourNotify.auth.loginError(error), [safeTourNotify]),
    logoutSuccess: useCallback(() => safeTourNotify.auth.logoutSuccess(), [safeTourNotify]),
    registrationSuccess: useCallback(() => safeTourNotify.auth.registrationSuccess(), [safeTourNotify]),
    otpSent: useCallback(() => safeTourNotify.auth.otpSent(), [safeTourNotify]),
    otpVerified: useCallback(() => safeTourNotify.auth.otpVerified(), [safeTourNotify]),
    // Additional functions for generic notifications
    showAuthSuccess: useCallback((message) => {
      return notify.success('Welcome back!', message || 'You have successfully logged in to SafeTourAI.');
    }, [notify]),
    showAuthError: useCallback((error) => {
      return notify.error('Login Failed', error || 'Please check your credentials and try again.');
    }, [notify]),
    showAuthInfo: useCallback((info) => {
      return notify.info('Processing', info || 'Please wait...');
    }, [notify])
  };
};

export const useKYCNotifications = () => {
  const { safeTourNotify } = useNotifications();
  
  return {
    submitted: useCallback(() => safeTourNotify.kyc.submitted(), [safeTourNotify]),
    approved: useCallback(() => safeTourNotify.kyc.approved(), [safeTourNotify]),
    rejected: useCallback((reason) => safeTourNotify.kyc.rejected(reason), [safeTourNotify]),
    documentsUploaded: useCallback(() => safeTourNotify.kyc.documentsUploaded(), [safeTourNotify])
  };
};

export const useEmergencyNotifications = () => {
  const { safeTourNotify } = useNotifications();
  
  return {
    alertSent: useCallback(() => safeTourNotify.emergency.alertSent(), [safeTourNotify]),
    responderAssigned: useCallback((name) => safeTourNotify.emergency.responderAssigned(name), [safeTourNotify]),
    emergencyResolved: useCallback(() => safeTourNotify.emergency.emergencyResolved(), [safeTourNotify])
  };
};

export const useSystemNotifications = () => {
  const { safeTourNotify } = useNotifications();
  
  return {
    profileUpdated: useCallback(() => safeTourNotify.system.profileUpdated(), [safeTourNotify]),
    settingsSaved: useCallback(() => safeTourNotify.system.settingsSaved(), [safeTourNotify]),
    dataSync: useCallback(() => safeTourNotify.system.dataSync(), [safeTourNotify]),
    connectionLost: useCallback(() => safeTourNotify.system.connectionLost(), [safeTourNotify]),
    connectionRestored: useCallback(() => safeTourNotify.system.connectionRestored(), [safeTourNotify])
  };
};

export const useBlockchainNotifications = () => {
  const { safeTourNotify } = useNotifications();
  
  return {
    transactionPending: useCallback(() => safeTourNotify.blockchain.transactionPending(), [safeTourNotify]),
    transactionConfirmed: useCallback((txHash) => safeTourNotify.blockchain.transactionConfirmed(txHash), [safeTourNotify]),
    transactionFailed: useCallback(() => safeTourNotify.blockchain.transactionFailed(), [safeTourNotify])
  };
};

export const useScannerNotifications = () => {
  const { safeTourNotify } = useNotifications();
  
  return {
    scanSuccess: useCallback(() => safeTourNotify.scanner.scanSuccess(), [safeTourNotify]),
    scanError: useCallback(() => safeTourNotify.scanner.scanError(), [safeTourNotify]),
    invalidCode: useCallback(() => safeTourNotify.scanner.invalidCode(), [safeTourNotify])
  };
};
