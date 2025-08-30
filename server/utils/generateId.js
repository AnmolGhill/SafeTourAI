const { v4: uuidv4 } = require('uuid');

/**
 * Generate unique IDs with prefixes
 * @param {string} prefix - The prefix for the ID (USR, EMG, TXN, etc.)
 * @returns {string} - Unique ID with prefix
 */
const generateId = (prefix) => {
  const uuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}_${timestamp}_${uuid}`;
};

/**
 * Generate user ID
 * @returns {string} - Unique user ID with USR prefix
 */
const generateUserId = () => {
  return generateId('USR');
};

/**
 * Generate emergency ID
 * @returns {string} - Unique emergency ID with EMG prefix
 */
const generateEmergencyId = () => {
  return generateId('EMG');
};

/**
 * Generate transaction ID
 * @returns {string} - Unique transaction ID with TXN prefix
 */
const generateTransactionId = () => {
  return generateId('TXN');
};

/**
 * Generate notification ID
 * @returns {string} - Unique notification ID with NOT prefix
 */
const generateNotificationId = () => {
  return generateId('NOT');
};

/**
 * Generate session ID
 * @returns {string} - Unique session ID with SES prefix
 */
const generateSessionId = () => {
  return generateId('SES');
};

module.exports = {
  generateId,
  generateUserId,
  generateEmergencyId,
  generateTransactionId,
  generateNotificationId,
  generateSessionId
};
