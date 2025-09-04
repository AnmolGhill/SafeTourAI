import toast from 'react-hot-toast';

export function useAuthNotifications() {
  const showAuthSuccess = (message) => {
    toast.success(message, {
      position: 'top-right',
      duration: 5000,
    });
  };

  const showAuthError = (message) => {
    toast.error(message, {
      position: 'top-right',
      duration: 5000,
    });
  };

  const showAuthInfo = (message) => {
    toast(message, {
      position: 'top-right',
      duration: 5000,
    });
  };

  return {
    showAuthSuccess,
    showAuthError,
    showAuthInfo,
  };
}
