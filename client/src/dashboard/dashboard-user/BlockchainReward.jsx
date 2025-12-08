import React, { useState, useRef } from 'react';
import { FiUpload, FiCheck, FiAlertCircle, FiLoader, FiCopy, FiDownload, FiCamera, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { processImageForBlockchain } from '../../utils/imageHasher';

const BlockchainReward = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hashData, setHashData] = useState(null);
  const [error, setError] = useState(null);
  const [rewardData, setRewardData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    try {
      setShowCamera(true); // Show modal first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('Camera stream started successfully');
      }
    } catch (err) {
      setShowCamera(false);
      const errorMsg = err.name === 'NotAllowedError' 
        ? 'Camera permission denied. Please allow camera access in your browser settings.'
        : err.name === 'NotFoundError'
        ? 'No camera device found on this device.'
        : 'Camera access failed. Please check your browser permissions.';
      toast.error(errorMsg);
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      setShowCamera(false);
    }
  };

  // Capture photo from camera
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setImagePreview(canvasRef.current.toDataURL());
        setError(null);
        stopCamera();
        toast.success('Photo captured!');
      }, 'image/jpeg', 0.95);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, WebP, or GIF.');
      toast.error('Invalid file type');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError('File size exceeds 10MB limit');
      toast.error('File too large');
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateHash = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await processImageForBlockchain(selectedImage);
      setHashData(result);
      toast.success('Image hashed successfully!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to process image';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToBlockchain = async () => {
    if (!hashData) {
      setError('Please generate hash first');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Simulate blockchain submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock reward data
      const mockRewardData = {
        transaction_hash: `0x${hashData.sha256}`,
        reward_amount: 0.001,
        clarity_bonus: hashData.clarity_score >= 80 ? 0.0005 : 0,
        wallet_address: '0x' + Math.random().toString(16).slice(2),
        status: 'completed'
      };
      
      setRewardData(mockRewardData);
      toast.success('✅ Image submitted to blockchain!');
    } catch (err) {
      const errorMsg = err.message || 'Failed to submit to blockchain';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const downloadHashData = () => {
    if (!hashData) return;

    const dataStr = JSON.stringify(hashData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-hash-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Hash data downloaded!');
  };

  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setHashData(null);
    setRewardData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🎁 Blockchain Reward</h1>
        <p className="text-gray-600">Upload photos to earn ETH rewards on the blockchain</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">📷 Take Photo</h3>
              <button
                onClick={stopCamera}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-80 object-cover rounded-lg bg-black"
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-2 mt-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FiCamera />
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📸 Upload Image</h2>

          {/* Image Preview */}
          {imagePreview ? (
            <div className="mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg border-2 border-blue-300"
              />
              <p className="text-sm text-gray-600 mt-2">
                File: {selectedImage?.name}
              </p>
              <p className="text-sm text-gray-600">
                Size: {(selectedImage?.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <FiUpload className="mx-auto text-4xl text-blue-500 mb-2" />
                <p className="text-gray-700 font-medium">Click to upload image</p>
                <p className="text-sm text-gray-500">JPEG, PNG, WebP, GIF (max 10MB)</p>
              </div>

              <button
                onClick={startCamera}
                className="w-full border-2 border-dashed border-purple-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition flex flex-col items-center gap-2"
              >
                <FiCamera className="text-4xl text-purple-500" />
                <p className="text-gray-700 font-medium">Take Photo with Camera</p>
                <p className="text-sm text-gray-500">Use your device camera</p>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleGenerateHash}
              disabled={!selectedImage || loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FiCheck />
                  Generate Hash
                </>
              )}
            </button>

            {selectedImage && (
              <button
                onClick={resetForm}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Hash Results Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Hash Results</h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {hashData ? (
            <div className="space-y-4">
              {/* SHA-256 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">SHA-256</label>
                  <button
                    onClick={() => copyToClipboard(hashData.sha256, 'SHA-256')}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Copy to clipboard"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
                  {hashData.sha256}
                </p>
              </div>

              {/* pHash */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Perceptual Hash (pHash)</label>
                  <button
                    onClick={() => copyToClipboard(hashData.phash, 'pHash')}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Copy to clipboard"
                  >
                    <FiCopy size={16} />
                  </button>
                </div>
                <p className="font-mono text-xs text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
                  {hashData.phash}
                </p>
              </div>

              {/* Clarity Score */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Clarity Score</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white rounded-full h-8 border-2 border-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${hashData.clarity_score}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-gray-800 w-12 text-right">
                    {hashData.clarity_score}%
                  </span>
                </div>
              </div>

              {/* File Info */}
              <div className="bg-blue-50 p-3 rounded-lg text-sm text-gray-700">
                <p><strong>File:</strong> {hashData.file_name}</p>
                <p><strong>Size:</strong> {(hashData.file_size / 1024).toFixed(2)} KB</p>
                <p><strong>Type:</strong> {hashData.file_type}</p>
              </div>

              {/* Download Button */}
              <button
                onClick={downloadHashData}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <FiDownload />
                Download Hash Data
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Generate hash to see results</p>
            </div>
          )}
        </div>
      </div>

      {/* Blockchain Submission */}
      {hashData && !rewardData && (
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">⛓️ Submit to Blockchain</h2>
          <p className="text-gray-700 mb-4">
            Submit your image hash to the blockchain to earn ETH rewards. Your unique hash will be recorded on the Ethereum blockchain.
          </p>
          <button
            onClick={handleSubmitToBlockchain}
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FiCheck />
                Submit to Blockchain & Claim Reward
              </>
            )}
          </button>
        </div>
      )}

      {/* Reward Confirmation */}
      {rewardData && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">✅</div>
            <h2 className="text-2xl font-bold text-green-800">Reward Claimed!</h2>
          </div>

          <div className="space-y-4">
            {/* Blockchain Hash */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">Blockchain Transaction Hash</label>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-gray-600 break-all flex-1 bg-gray-50 p-2 rounded">
                  {rewardData.transaction_hash || rewardData.blockchainHash || 'Processing...'}
                </p>
                <button
                  onClick={() => copyToClipboard(rewardData.transaction_hash || rewardData.blockchainHash, 'TX Hash')}
                  className="text-blue-600 hover:text-blue-800 p-2 flex-shrink-0"
                >
                  <FiCopy size={18} />
                </button>
              </div>
            </div>

            {/* Reward Amount */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <label className="text-sm font-semibold text-gray-700 block mb-2">ETH Reward</label>
              <p className="text-3xl font-bold text-green-600">
                {rewardData.reward_amount || rewardData.ethReward || '0.0'} ETH
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Transferred to your wallet
              </p>
            </div>

            {/* Wallet Address */}
            {rewardData.wallet_address && (
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <label className="text-sm font-semibold text-gray-700 block mb-2">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-gray-600 break-all flex-1 bg-gray-50 p-2 rounded">
                    {rewardData.wallet_address}
                  </p>
                  <button
                    onClick={() => copyToClipboard(rewardData.wallet_address, 'Wallet')}
                    className="text-blue-600 hover:text-blue-800 p-2 flex-shrink-0"
                  >
                    <FiCopy size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Clarity Bonus */}
            {rewardData.clarity_bonus && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>✨ Clarity Bonus:</strong> +{rewardData.clarity_bonus} ETH for high-quality image
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={resetForm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                Upload Another Image
              </button>
              <a
                href={`https://etherscan.io/tx/${rewardData.transaction_hash || rewardData.blockchainHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition text-center"
              >
                View on Etherscan
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50 border-l-4 border-blue-600">
          <h3 className="font-semibold text-blue-900 mb-2">🔐 SHA-256</h3>
          <p className="text-sm text-blue-800">Cryptographic hash for image verification and blockchain recording</p>
        </div>
        <div className="card bg-purple-50 border-l-4 border-purple-600">
          <h3 className="font-semibold text-purple-900 mb-2">👁️ pHash</h3>
          <p className="text-sm text-purple-800">Perceptual hash for duplicate detection and similarity matching</p>
        </div>
        <div className="card bg-green-50 border-l-4 border-green-600">
          <h3 className="font-semibold text-green-900 mb-2">✨ Clarity Score</h3>
          <p className="text-sm text-green-800">Image quality metric affecting reward amount</p>
        </div>
      </div>
    </div>
  );
};

export default BlockchainReward;
