import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Connect to socket server
  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io('http://localhost:5000', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupEventListeners();
  }

  // Setup socket event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to SafeTourAI server');
      this.emit('user_online', { timestamp: new Date() });
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from SafeTourAI server');
    });

    this.socket.on('emergency_alert', (data) => {
      this.notifyListeners('emergency_alert', data);
    });

    this.socket.on('responder_assigned', (data) => {
      this.notifyListeners('responder_assigned', data);
    });

    this.socket.on('emergency_updated', (data) => {
      this.notifyListeners('emergency_updated', data);
    });

    this.socket.on('blockchain_transaction', (data) => {
      this.notifyListeners('blockchain_transaction', data);
    });

    this.socket.on('notification', (data) => {
      this.notifyListeners('notification', data);
    });
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  // Join room (for location-based updates)
  joinRoom(roomName) {
    this.emit('join_room', { room: roomName });
  }

  // Leave room
  leaveRoom(roomName) {
    this.emit('leave_room', { room: roomName });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify listeners
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected;
  }
}

export default new SocketService();
