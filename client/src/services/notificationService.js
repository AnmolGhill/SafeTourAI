import { messaging } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { notificationsAPI } from '../config/api';

class NotificationService {
  constructor() {
    this.token = null;
    this.listeners = [];
    this.initializeMessaging();
  }

  // Initialize Firebase messaging
  async initializeMessaging() {
    try {
      // Skip Firebase messaging initialization to avoid errors
      console.log('Firebase messaging initialization skipped');
      return;
      
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Get FCM token
        this.token = await getToken(messaging, {
          vapidKey: 'your-vapid-key' // Add your VAPID key here
        });
        
        if (this.token) {
          // Subscribe to backend notifications
          await this.subscribeToNotifications();
        }

        // Listen for foreground messages
        onMessage(messaging, (payload) => {
          this.handleForegroundMessage(payload);
        });
      }
    } catch (error) {
      console.error('Error initializing messaging:', error);
    }
  }

  // Subscribe to backend notifications
  async subscribeToNotifications() {
    try {
      if (this.token) {
        await notificationsAPI.subscribe(this.token);
      }
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  // Handle foreground messages
  handleForegroundMessage(payload) {
    const { title, body, data } = payload.notification || {};
    
    // Show browser notification
    this.sendLocalNotification(title, body);
    
    // Notify listeners
    this.notifyListeners('message_received', {
      title,
      body,
      data: payload.data
    });
  }

  // Send local browser notification
  async sendLocalNotification(title, body, options = {}) {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);
      
      return notification;
    }
  }

  // Get all notifications
  async getNotifications(params = {}) {
    try {
      const response = await notificationsAPI.getAll(params);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await notificationsAPI.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      await notificationsAPI.markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  // Send test notification
  async sendTestNotification(data) {
    try {
      await notificationsAPI.sendTestNotification(data);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Add listener for notification events
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  // Get FCM token
  getToken() {
    return this.token;
  }
}

export default new NotificationService();
