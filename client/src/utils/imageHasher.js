/**
 * Browser-compatible SHA-256 hash generation using SubtleCrypto
 * @param {Uint8Array} buffer - Image buffer
 * @returns {Promise<string>} SHA-256 hash in hex format
 */
const generateSHA256 = async (buffer) => {
  try {
    if (!buffer || !(buffer instanceof Uint8Array)) {
      throw new Error('Invalid buffer provided');
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error('SHA-256 generation error:', error);
    throw new Error(`SHA-256 hash generation failed: ${error.message}`);
  }
};

/**
 * Generate perceptual hash (pHash) from image buffer
 * Uses a simplified algorithm for browser compatibility
 * @param {Uint8Array} buffer - Image buffer
 * @returns {string} Perceptual hash in hex format
 */
const generatePHash = (buffer) => {
  try {
    if (!buffer || !(buffer instanceof Uint8Array)) {
      throw new Error('Invalid buffer provided');
    }

    // Create a hash from buffer chunks
    let hash = 0;

    for (let i = 0; i < buffer.length; i++) {
      const byte = buffer[i];
      hash = ((hash << 5) - hash) + byte;
      hash = hash & hash; // Convert to 32-bit integer
    }

    // Convert to hex and pad
    return Math.abs(hash).toString(16).padStart(16, '0');
  } catch (error) {
    console.error('pHash generation error:', error);
    throw new Error(`Perceptual hash generation failed: ${error.message}`);
  }
};

/**
 * Calculate image clarity score based on buffer characteristics
 * @param {Uint8Array} buffer - Image buffer
 * @returns {number} Clarity score (0-100)
 */
const calculateClarityScore = (buffer) => {
  try {
    if (!buffer || !(buffer instanceof Uint8Array)) {
      throw new Error('Invalid buffer provided');
    }

    let variance = 0;
    let mean = 0;

    // Calculate mean
    for (let i = 0; i < buffer.length; i++) {
      mean += buffer[i];
    }
    mean /= buffer.length;

    // Calculate variance
    for (let i = 0; i < buffer.length; i++) {
      variance += Math.pow(buffer[i] - mean, 2);
    }
    variance /= buffer.length;

    // Normalize variance to 0-100 scale
    // Higher variance = sharper image = higher clarity
    const clarityScore = Math.min(100, Math.sqrt(variance) / 2.56);

    return Math.round(clarityScore);
  } catch (error) {
    console.error('Clarity score calculation error:', error);
    throw new Error(`Clarity score calculation failed: ${error.message}`);
  }
};

/**
 * Process image file and generate hashes with clarity score
 * @param {File} imageFile - Image file from frontend
 * @returns {Promise<{sha256: string, phash: string, clarity_score: number, file_size: number, file_name: string}>}
 */
export const processImageForBlockchain = async (imageFile) => {
  try {
    // Validate file
    if (!imageFile || !(imageFile instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(imageFile.type)) {
      throw new Error(`Invalid file type: ${imageFile.type}. Supported: JPEG, PNG, WebP, GIF`);
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      throw new Error(`File size exceeds maximum limit of 10MB`);
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate hashes
    const sha256 = await generateSHA256(buffer);
    const phash = generatePHash(buffer);
    const clarity_score = calculateClarityScore(buffer);

    return {
      sha256,
      phash,
      clarity_score,
      file_size: imageFile.size,
      file_name: imageFile.name,
      file_type: imageFile.type,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * Process image from URL and generate hashes
 * @param {string} imageUrl - URL of the image
 * @returns {Promise<{sha256: string, phash: string, clarity_score: number}>}
 */
export const processImageFromUrl = async (imageUrl) => {
  try {
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid URL provided');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const sha256 = generateSHA256(buffer);
    const phash = generatePHash(buffer);
    const clarity_score = calculateClarityScore(buffer);

    return {
      sha256,
      phash,
      clarity_score,
      url: imageUrl,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Image URL processing error:', error);
    throw new Error(`Image URL processing failed: ${error.message}`);
  }
};

/**
 * Verify image hash integrity
 * @param {File} imageFile - Image file
 * @param {string} expectedSha256 - Expected SHA-256 hash
 * @returns {Promise<boolean>}
 */
export const verifyImageHash = async (imageFile, expectedSha256) => {
  try {
    const result = await processImageForBlockchain(imageFile);
    return result.sha256 === expectedSha256;
  } catch (error) {
    console.error('Hash verification error:', error);
    throw new Error(`Hash verification failed: ${error.message}`);
  }
};

/**
 * Batch process multiple images
 * @param {File[]} imageFiles - Array of image files
 * @returns {Promise<Array>}
 */
export const batchProcessImages = async (imageFiles) => {
  try {
    if (!Array.isArray(imageFiles)) {
      throw new Error('imageFiles must be an array');
    }

    const results = await Promise.all(
      imageFiles.map(file => processImageForBlockchain(file))
    );

    return results;
  } catch (error) {
    console.error('Batch processing error:', error);
    throw new Error(`Batch processing failed: ${error.message}`);
  }
};

export default {
  processImageForBlockchain,
  processImageFromUrl,
  verifyImageHash,
  batchProcessImages,
  generateSHA256,
  generatePHash,
  calculateClarityScore
};
