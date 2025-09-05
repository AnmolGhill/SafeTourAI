import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import toast from 'react-hot-toast';
import './KYCVerification.css';
import { kycAPI } from '../config/api';

const KYCVerification = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    governmentIdType: '',
    governmentIdNumber: '',
    consentGiven: false
  });

  const [files, setFiles] = useState({
    document: null,
    selfie: null
  });

  const [kycStatus, setKycStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [blockchainData, setBlockchainData] = useState(null);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No auth token found, user not logged in');
        setKycStatus('not_submitted');
        return;
      }

      const response = await kycAPI.getStatus();
      
      if (response.data.success) {
        setKycStatus(response.data.data.kycStatus);
        setBlockchainData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      // Set default status if error
      setKycStatus('not_submitted');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({
      ...prev,
      [name]: selectedFiles[0]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.address.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.address.city.trim()) newErrors.city = 'City is required';
    if (!formData.address.state.trim()) newErrors.state = 'State is required';
    if (!formData.address.country.trim()) newErrors.country = 'Country is required';
    if (!formData.address.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!formData.governmentIdType) newErrors.governmentIdType = 'Government ID type is required';
    if (!formData.governmentIdNumber.trim()) newErrors.governmentIdNumber = 'Government ID number is required';
    if (!formData.consentGiven) newErrors.consentGiven = 'Consent is required to proceed';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        if (key === 'address') {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Append files
      if (files.document) {
        formDataToSend.append('document', files.document);
      }
      if (files.selfie) {
        formDataToSend.append('selfie', files.selfie);
      }

      const response = await kycAPI.submit(formDataToSend);

      if (response.data.success) {
        setKycStatus('submitted');
        toast.success('KYC submitted successfully! Your application is now under review.', {
          position: 'top-center',
          duration: 4000
        });
        // Refresh KYC status to get updated data
        await fetchKYCStatus();
      } else {
        toast.error(response.data.message || 'Failed to submit KYC information', {
          position: 'top-center',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      const errorMessage = error.message || 'An error occurred while submitting KYC information';
      toast.error(errorMessage, {
        position: 'top-center',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state with animation
  if (loading && kycStatus === null) {
    return (
      <div className="kyc-container">
        <div className="kyc-loading">
          <div className="loading-animation">
            <div className="loading-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <h2>🔍 Verifying KYC status and generating Digital ID...</h2>
            <p>Please wait while we check your verification status</p>
            <div className="loading-steps">
              <div className="step active">📋 Checking KYC submission</div>
              <div className="step">⏳ Verifying documents</div>
              <div className="step">⛓️ Generating blockchain ID</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === 'approved') {
    return (
      <div className="kyc-container">
        <div className="kyc-success">
          <div className="success-icon">✅</div>
          <h2>KYC Verified Successfully!</h2>
          <p>Your identity has been verified and blockchain ID has been created.</p>
          
          <div className="blockchain-info">
            <h3>Your Blockchain Identity</h3>
            <div className="info-item">
              <label>Blockchain ID:</label>
              <span className="blockchain-id">{blockchainData?.blockchainId}</span>
            </div>
            <div className="info-item">
              <label>Wallet Address:</label>
              <span className="wallet-address">{blockchainData?.walletAddress}</span>
            </div>
            <div className="info-item">
              <label>Status:</label>
              <span className="status verified">Verified ✓</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (kycStatus === 'submitted') {
    return (
      <div className="kyc-container">
        <div className="kyc-pending">
          <div className="pending-icon">⏳</div>
          <h2>KYC Under Review</h2>
          <p>Your KYC information has been submitted and is currently under review.</p>
          <p>You will be notified once the verification is complete.</p>
        </div>
      </div>
    );
  }

  if (kycStatus === 'rejected') {
    return (
      <div className="kyc-container">
        <div className="kyc-rejected">
          <div className="rejected-icon">❌</div>
          <h2>KYC Verification Failed</h2>
          <p>Your KYC submission was rejected.</p>
          {blockchainData?.rejectionReason && (
            <p className="rejection-reason">Reason: {blockchainData.rejectionReason}</p>
          )}
          <button onClick={() => setKycStatus('pending')} className="retry-btn">
            Submit Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-container">
      <div className="kyc-header">
        <h1>🔗 Blockchain ID & KYC Verification</h1>
        <p>Complete your identity verification to create your secure blockchain ID</p>
      </div>

      <form onSubmit={handleSubmit} className="kyc-form">
        {/* Basic Identity Section */}
        <div className="form-section">
          <h3>📋 Basic Identity Information</h3>
          
          <div className="form-group">
            <label htmlFor="fullName">Full Name (as per Govt ID) *</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              className={errors.fullName ? 'error' : ''}
              placeholder="Enter your full name"
            />
            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth *</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={errors.dateOfBirth ? 'error' : ''}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender *</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="form-section">
          <h3>🏠 Address Information</h3>
          
          <div className="form-group">
            <label htmlFor="street">Street Address *</label>
            <input
              type="text"
              id="street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className={errors.street ? 'error' : ''}
              placeholder="Enter street address"
            />
            {errors.street && <span className="error-text">{errors.street}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City *</label>
              <input
                type="text"
                id="city"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                className={errors.city ? 'error' : ''}
                placeholder="City"
              />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="state">State *</label>
              <input
                type="text"
                id="state"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                className={errors.state ? 'error' : ''}
                placeholder="State"
              />
              {errors.state && <span className="error-text">{errors.state}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="country">Country *</label>
              <input
                type="text"
                id="country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                className={errors.country ? 'error' : ''}
                placeholder="Country"
              />
              {errors.country && <span className="error-text">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="pincode">Pincode *</label>
              <input
                type="text"
                id="pincode"
                name="address.pincode"
                value={formData.address.pincode}
                onChange={handleInputChange}
                className={errors.pincode ? 'error' : ''}
                placeholder="Pincode"
              />
              {errors.pincode && <span className="error-text">{errors.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Government ID Section */}
        <div className="form-section">
          <h3>🆔 Government ID Verification</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="governmentIdType">ID Type *</label>
              <select
                id="governmentIdType"
                name="governmentIdType"
                value={formData.governmentIdType}
                onChange={handleInputChange}
                className={errors.governmentIdType ? 'error' : ''}
              >
                <option value="">Select ID Type</option>
                <option value="aadhaar">Aadhaar Card</option>
                <option value="passport">Passport</option>
                <option value="driving_license">Driving License</option>
              </select>
              {errors.governmentIdType && <span className="error-text">{errors.governmentIdType}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="governmentIdNumber">ID Number *</label>
              <input
                type="text"
                id="governmentIdNumber"
                name="governmentIdNumber"
                value={formData.governmentIdNumber}
                onChange={handleInputChange}
                className={errors.governmentIdNumber ? 'error' : ''}
                placeholder="Enter ID number"
              />
              {errors.governmentIdNumber && <span className="error-text">{errors.governmentIdNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="document">Upload ID Document (PDF/JPG)</label>
              <input
                type="file"
                id="document"
                name="document"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="file-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="selfie">Selfie with ID (Optional)</label>
              <input
                type="file"
                id="selfie"
                name="selfie"
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png"
                className="file-input"
              />
            </div>
          </div>
        </div>

        {/* Blockchain Section */}
        <div className="form-section blockchain-section">
          <h3>⛓️ Blockchain Identity</h3>
          <div className="blockchain-info-preview">
            <p>Upon verification, the following will be automatically generated:</p>
            <div className="info-item">
              <label>Blockchain Wallet Address:</label>
              <span className="auto-generated">(Auto-generated after verification)</span>
            </div>
            <div className="info-item">
              <label>Blockchain ID:</label>
              <span className="auto-generated">USR-BC-XXXXXX (Auto-generated)</span>
            </div>
          </div>
        </div>

        {/* Consent Section */}
        <div className="form-section consent-section">
          <div className="consent-checkbox">
            <input
              type="checkbox"
              id="consentGiven"
              name="consentGiven"
              checked={formData.consentGiven}
              onChange={handleInputChange}
              className={errors.consentGiven ? 'error' : ''}
            />
            <label htmlFor="consentGiven">
              ✅ I agree to share my verified data with SafeTourAI blockchain system for emergency safety verification.
            </label>
          </div>
          {errors.consentGiven && <span className="error-text">{errors.consentGiven}</span>}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
{loading ? 'Submitting...' : 'Submit KYC & Create Blockchain ID'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default KYCVerification;
