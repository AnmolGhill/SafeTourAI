import React, { useState, useEffect } from 'react';
import './AdminKYC.css';
import { adminAPI } from '../config/api';

const AdminKYC = () => {
  const [pendingKYC, setPendingKYC] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingKYC();
    fetchStatistics();
  }, []);

  const fetchPendingKYC = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getPendingKYCs();
      setPendingKYC(response.data || []);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
      alert('Failed to fetch pending KYC applications');
    } finally {
      setLoading(false);
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
      setStatistics({
        total: 0,
        submitted: 0,
        verified: 0,
        rejected: 0,
        blockchainVerified: 0
      });
    }
  };

  const handleVerifyKYC = async (userId, action, reason = '') => {
    setLoading(true);
    try {
      const response = await adminAPI.reviewKYC(userId, action, reason);
      
      alert(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
      
      if (action === 'approve' && response.data?.blockchainId) {
        alert(`Blockchain ID generated: ${response.data.blockchainId}`);
      }
      
      // Refresh data
      await Promise.all([fetchPendingKYC(), fetchStatistics()]);
      
      setShowModal(false);
      setSelectedUser(null);
      setRejectionReason('');
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
      alert(`Failed to ${action} KYC: ${error.message}`);
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
          <button onClick={fetchPendingKYC} className="refresh-btn">
            🔄 Refresh
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
                {loading ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminKYC;
