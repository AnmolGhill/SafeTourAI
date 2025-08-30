/**
 * Generate a random numeric OTP
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOtp = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

/**
 * Generate OTP with expiration time
 * @param {number} length - Length of the OTP (default: 6)
 * @param {number} expiryMinutes - Expiry time in minutes (default: 10)
 * @returns {object} - Object containing OTP and expiry time
 */
const generateOtpWithExpiry = (length = 6, expiryMinutes = 10) => {
  const otp = generateOtp(length);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    otp,
    expiresAt
  };
};

/**
 * Validate if OTP is still valid
 * @param {Date} expiryTime - The expiry time of the OTP
 * @returns {boolean} - True if OTP is still valid
 */
const isOtpValid = (expiryTime) => {
  return new Date() < new Date(expiryTime);
};

/**
 * Generate alphanumeric OTP
 * @param {number} length - Length of the OTP (default: 6)
 * @returns {string} - Generated alphanumeric OTP
 */
const generateAlphanumericOtp = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return otp;
};

module.exports = {
  generateOtp,
  generateOtpWithExpiry,
  isOtpValid,
  generateAlphanumericOtp
};
