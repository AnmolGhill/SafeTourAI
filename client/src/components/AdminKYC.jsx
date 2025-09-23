import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/auth';
import toast from 'react-hot-toast';
import './AdminKYC.css';
import { kycAPI, downloadKYCDocument, adminAPI } from '../config/api';
import { FiLoader } from 'react-icons/fi';

const AdminKYC = () => {
  const [pendingKYC, setPendingKYC] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      setDataLoading(true);
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptLoad = async () => {
        try {
          // Load statistics first (usually faster and smaller response)
          await fetchStatistics();
          // Then load KYC data
          await fetchPendingKYC();
        } catch (error) {
          console.error(`Error loading initial data (attempt ${retryCount + 1}):`, error);
          
          if (retryCount < maxRetries && !error.message.includes('Authentication failed')) {
            retryCount++;
            console.log(`Retrying... (${retryCount}/${maxRetries})`);
            // Wait 2 seconds before retry
            await new Promise(resolve => setTimeout(resolve, 2000));
            return attemptLoad();
          }
          
          // If all retries failed, show error but don't crash
          toast.error(`Failed to load dashboard data. Please refresh the page.`);
        }
      };
      
      try {
        await attemptLoad();
      } finally {
        setDataLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const fetchPendingKYC = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await adminAPI.getPendingKYCs();
      setPendingKYC(response.data || []);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      if (error.message.includes('Authentication failed')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (error.message.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Failed to fetch pending KYC applications');
      }
      // Set empty array on error to prevent UI issues
      setPendingKYC([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const kycStats = await adminAPI.getKYCStats();
      
      setStatistics({
        total: kycStats.data?.total || 0,
        submitted: kycStats.data?.submitted || 0,
        verified: kycStats.data?.approved || 0,
        rejected: kycStats.data?.rejected || 0,
        blockchainVerified: kycStats.data?.approved || 0
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      if (error.message.includes('Authentication failed')) {
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (error.message.includes('timeout')) {
        toast.error('Statistics request timed out.');
      }
      
      // Always set fallback statistics to prevent UI issues
      setStatistics({
        total: 0,
        submitted: 0,
        verified: 0,
        rejected: 0,
        blockchainVerified: 0
      });
    }
  };

  const handleViewDocument = async (userId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getKYCDocuments(userId);
      
      if (!response?.data?.success) {
        throw new Error(response?.data?.error || 'Failed to load documents');
      }
      
      const documents = response.data.documents || {};
      const metadata = response.data.documentMetadata || {};
      let hasDocuments = false;
      
      // Try to open documents in new tabs
      if (documents.document) {
        try {
          const tab = window.open('', '_blank');
          if (tab) {
            tab.location.href = documents.document;
            hasDocuments = true;
          } else {
            console.warn('Pop-up was blocked. Please allow pop-ups for this site.');
            // Fallback to download if popup is blocked
            const fileName = metadata?.document?.fileName || 'kyc_document.pdf';
            await downloadKYCDocument(documents.document, fileName);
            hasDocuments = true;
          }
        } catch (error) {
          console.error('Error opening document:', error);
          // If opening fails, try to download instead
          const fileName = metadata?.document?.fileName || 'kyc_document.pdf';
          await downloadKYCDocument(documents.document, fileName);
          hasDocuments = true;
        }
      }
      
      if (documents.selfie) {
        try {
          const tab = window.open('', '_blank');
          if (tab) {
            tab.location.href = documents.selfie;
            hasDocuments = true;
          } else {
            console.warn('Pop-up was blocked. Please allow pop-ups for this site.');
            // Fallback to download if popup is blocked
            const fileName = metadata?.selfie?.fileName || 'kyc_selfie.jpg';
            await downloadKYCDocument(documents.selfie, fileName);
            hasDocuments = true;
          }
        } catch (error) {
          console.error('Error opening selfie:', error);
          // If opening fails, try to download instead
          const fileName = metadata?.selfie?.fileName || 'kyc_selfie.jpg';
          await downloadKYCDocument(documents.selfie, fileName);
          hasDocuments = true;
        }
      }
      
      if (!hasDocuments) {
        toast.warning('No documents found for this user', {
          position: 'top-center',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error viewing documents:', error);
      toast.error('Failed to load KYC data: ' + error.message, {
        position: 'top-center',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (userId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getKYCDocuments(userId);
      if (response.data.success) {
        const documents = response.data.documents;
        const metadata = response.data.documentMetadata || {};
        let downloadedCount = 0;
        
        // Download documents using the utility function
        if (documents.document) {
          const fileName = metadata.document?.fileName || 'kyc_document.pdf';
          try {
            await downloadKYCDocument(documents.document, fileName);
            downloadedCount++;
          } catch (error) {
            console.error('Error downloading document:', error);
            // Continue with other downloads even if one fails
          }
        }
        
        if (documents.selfie) {
          const fileName = metadata.selfie?.fileName || 'kyc_selfie.jpg';
          try {
            await downloadKYCDocument(documents.selfie, fileName);
            downloadedCount++;
          } catch (error) {
            console.error('Error downloading selfie:', error);
            // Continue with other downloads even if one fails
          }
        }
        
        if (downloadedCount > 0) {
          toast.success(`Successfully downloaded ${downloadedCount} file(s)`, {
            position: 'top-center',
            duration: 3000
          });
        } else {
          toast.warning('No documents were downloaded. Please try again or contact support.', {
            position: 'top-center',
            duration: 4000
          });
        }
      } else {
        toast.error('Failed to download documents: ' + (response.data.error || 'Unknown error'), {
          position: 'top-center',
          duration: 4000
        });
      }
    } catch (error) {
      console.error('Error downloading documents:', error);
      toast.error('Failed to download KYC data: ' + error.message, {
        position: 'top-center',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKYC = async (userId, action, reason = '') => {
    setLoading(true);
    try {
      const response = await adminAPI.reviewKYC(userId, action, reason);
      
      if (action === 'approve') {
        toast.success('KYC approved successfully!' + (response.data?.blockchainId ? `\nReal Blockchain ID Generated: ${response.data.blockchainId}` : ''), {
          position: 'top-center',
          duration: 3000
        });
      } else {
        toast.success('KYC rejected successfully!', {
          position: 'top-center',
          duration: 3000
        });
      }
      
      // Refresh data
      await Promise.all([fetchPendingKYC(false), fetchStatistics()]);
      
      setShowModal(false);
      setSelectedUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
      toast.error('Failed to approve KYC: ' + error.message, {
        position: 'top-center',
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user, action) => {
    setSelectedUser(user);
    setActionType(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setActionType('');
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (actionType === 'reject' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    
    handleVerifyKYC(selectedUser.uid, actionType, rejectionReason);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="admin-kyc-container">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        {/* Header Skeleton */}
        <div className="h-8 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-80 animate-pulse"></div>
      </div>

      {/* Statistics Cards Skeleton */}
      <div className="stats-grid">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="stat-card">
            <div className="stat-icon">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="stat-content">
              <div className="h-6 bg-gray-200 rounded w-12 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="kyc-table-container">
        <div className="table-header">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
        </div>

        <div className="table-wrapper">
          <table className="kyc-table">
            <thead>
              <tr>
                {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                  <th key={item}>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((row) => (
                <tr key={row}>
                  {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                    <td key={col}>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading indicator overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 sm:p-8 flex flex-col items-center space-y-4 max-w-sm sm:max-w-md w-full mx-4">
          <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-700 font-medium text-center text-sm sm:text-base">Loading KYC Dashboard...</p>
          <p className="text-gray-500 text-xs sm:text-sm text-center">Fetching pending verification requests</p>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while data is being fetched
  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="admin-kyc-container">
      <div className="admin-kyc-header">
        <h1>🔍 KYC Management Dashboard</h1>
        <p>Review and verify user KYC submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{statistics.total || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{statistics.submitted || 0}</h3>
            <p>Pending Review</p>
          </div>
        </div>
        <div className="stat-card verified">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{statistics.verified || 0}</h3>
            <p>Verified</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{statistics.rejected || 0}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card blockchain">
          <div className="stat-icon">⛓️</div>
          <div className="stat-content">
            <h3>{statistics.blockchainVerified || 0}</h3>
            <p>Blockchain IDs</p>
          </div>
        </div>
      </div>

      {/* Pending KYC Table */}
      <div className="kyc-table-container">
        <div className="table-header">
          <h2>Pending KYC Submissions</h2>
          <button onClick={() => fetchPendingKYC(true)} className="refresh-btn" disabled={loading}>
            {loading ? (
              <span className="loading-text">
                <div className="button-spinner"></div>
                Loading...
              </span>
            ) : (
              '🔄 Refresh'
            )}
          </button>
        </div>

        {pendingKYC.length === 0 ? (
          <div className="no-data">
            <p>No pending KYC submissions</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="kyc-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>ID Type</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingKYC.map((application) => (
                  <tr key={application.uid}>
                    <td className="user-id">{application.uid}</td>
                    <td>{application.userName || application.fullName}</td>
                    <td>{application.userEmail}</td>
                    <td>{application.fullName}</td>
                    <td>
                      <span className="id-type">
                        {application.governmentIdType?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td>{formatDate(application.submittedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openModal(application, 'approve')}
                          className="approve-btn"
                          disabled={loading}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => openModal(application, 'reject')}
                          className="reject-btn"
                          disabled={loading}
                        >
                          ❌ Reject
                        </button>
                        <button
                          onClick={() => setSelectedUser(application)}
                          className="view-btn"
                          disabled={loading}
                        >
                          👁️ View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {actionType === 'approve' ? '✅ Approve KYC' : '❌ Reject KYC'}
              </h3>
              <button onClick={closeModal} className="close-btn">×</button>
            </div>
            
            <div className="modal-body">
              <div className="user-details">
                <h4>User Details:</h4>
                <p><strong>Name:</strong> {selectedUser?.userName || selectedUser?.fullName}</p>
                <p><strong>Email:</strong> {selectedUser?.userEmail}</p>
                <p><strong>Full Name:</strong> {selectedUser?.fullName}</p>
                <p><strong>DOB:</strong> {selectedUser?.dateOfBirth ? new Date(selectedUser.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Gender:</strong> {selectedUser?.gender}</p>
                <p><strong>ID Type:</strong> {selectedUser?.governmentIdType?.toUpperCase()}</p>
                <p><strong>ID Number:</strong> {selectedUser?.governmentIdNumber}</p>
                
                {/* Address Information */}
                {selectedUser?.address && (
                  <div className="address-section">
                    <h5>Address:</h5>
                    <p><strong>Street:</strong> {selectedUser.address.street}</p>
                    <p><strong>City:</strong> {selectedUser.address.city}</p>
                    <p><strong>State:</strong> {selectedUser.address.state}</p>
                    <p><strong>Country:</strong> {selectedUser.address.country}</p>
                    <p><strong>Pincode:</strong> {selectedUser.address.pincode}</p>
                  </div>
                )}

                {/* Documents Section */}
                <div className="documents-section">
                  <h5>Submitted Documents:</h5>
                  {selectedUser?.documents && Object.keys(selectedUser.documents).length > 0 ? (
                    <div className="documents-grid">
                      {Object.entries(selectedUser.documents).map(([docType, docUrl]) => (
                        <div key={docType} className="document-item">
                          <span className="doc-type">{docType.replace('_', ' ').toUpperCase()}</span>
                          <div className="doc-actions">
                            <button 
                              onClick={() => handleViewDocument(selectedUser.uid)}
                              className="view-doc-btn"
                              title="View Document"
                            >
                              👁️ View
                            </button>
                            <button 
                              onClick={() => handleDownloadDocument(selectedUser.uid)}
                              className="download-doc-btn"
                              title="Download Document"
                            >
                              📥 Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-documents">No documents uploaded</p>
                  )}
                </div>
              </div>

              {actionType === 'approve' ? (
                <div className="approval-info">
                  <p>⚠️ This will:</p>
                  <ul>
                    <li>Mark the user's KYC as verified</li>
                    <li>Generate a blockchain wallet address</li>
                    <li>Create a unique blockchain ID</li>
                    <li>Record the verification on the blockchain</li>
                  </ul>
                </div>
              ) : (
                <div className="rejection-form">
                  <label htmlFor="rejectionReason">
                    <strong>Rejection Reason *</strong>
                  </label>
                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows="4"
                    required
                  />
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={closeModal} className="cancel-btn">
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={actionType === 'approve' ? 'confirm-approve-btn' : 'confirm-reject-btn'}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-text">
                    <div className="button-spinner"></div>
                    {actionType === 'approve' ? 'Approving & Creating Blockchain ID...' : 'Processing Rejection...'}
                  </span>
                ) : (
                  `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
