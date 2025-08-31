// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api',
  SOCKET_URL: 'http://localhost:5000',
  TIMEOUT: 10000,
};

// Emergency Types
export const EMERGENCY_TYPES = {
  MEDICAL: 'medical',
  ACCIDENT: 'accident', 
  CRIME: 'crime',
  FIRE: 'fire',
  NATURAL_DISASTER: 'natural_disaster',
  OTHER: 'other'
};

// Emergency Severity Levels
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Emergency Status
export const EMERGENCY_STATUS = {
  ACTIVE: 'active',
  RESPONDED: 'responded',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  RESPONDER: 'responder',
  ADMIN: 'admin'
};

// KYC Status
export const KYC_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  REJECTED: 'rejected'
};

// Blockchain Transaction Types
export const TRANSACTION_TYPES = {
  EMERGENCY_CREATED: 'emergency_created',
  EMERGENCY_UPDATED: 'emergency_updated',
  RESPONDER_ASSIGNED: 'responder_assigned',
  EMERGENCY_RESOLVED: 'emergency_resolved',
  USER_ACTION: 'user_action'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  EMERGENCY_ALERT: 'emergency_alert',
  RESPONDER_ASSIGNED: 'responder_assigned',
  EMERGENCY_RESOLVED: 'emergency_resolved',
  KYC_UPDATE: 'kyc_update',
  SYSTEM_UPDATE: 'system_update'
};
