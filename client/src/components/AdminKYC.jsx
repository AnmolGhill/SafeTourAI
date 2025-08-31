import React, { useState, useEffect } from 'react';
import './AdminKYC.css';

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
    try {
      // Mock data for demo purposes since backend is not running
      const mockPendingKYC = [
        {
          _id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          kyc: {
            status: 'pending',
            submittedAt: new Date().toISOString(),
            documents: ['passport.jpg', 'utility_bill.pdf']
          }
        },
        {
          _id: '2', 
          name: 'Jane Smith',
          email: 'jane@example.com',
          kyc: {
            status: 'pending',
            submittedAt: new Date().toISOString(),
            documents: ['license.jpg', 'bank_statement.pdf']
          }
        }
      ];
      setPendingKYC(mockPendingKYC);
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      // Mock statistics for demo purposes since backend is not running
      const mockStatistics = {
        totalSubmissions: 25,
        pendingReview: 8,
        approved: 15,
        rejected: 2,
        averageProcessingTime: '2.5 days'
      };
      setStatistics(mockStatistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleVerifyKYC = async (userId, action, reason = '') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/kyc/verify/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          action,
          rejectionReason: reason
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        fetchPendingKYC();
        fetchStatistics();
        setShowModal(false);
        setSelectedUser(null);
        setRejectionReason('');
      } else {
        alert(data.message || `Failed to ${action} KYC`);
      }
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
      alert(`An error occurred while ${action}ing KYC`);
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
    
    handleVerifyKYC(selectedUser.userId, actionType, rejectionReason);
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
                {pendingKYC.map((user) => (
                  <tr key={user.userId}>
                    <td className="user-id">{user.userId}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.kyc.fullName}</td>
                    <td>
                      <span className="id-type">
                        {user.kyc.governmentId?.type?.toUpperCase() || 'N/A'}
                      </span>
                    </td>
                    <td>{formatDate(user.kyc.submittedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => openModal(user, 'approve')}
                          className="approve-btn"
                          disabled={loading}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => openModal(user, 'reject')}
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
                <p><strong>Name:</strong> {selectedUser?.name}</p>
                <p><strong>Email:</strong> {selectedUser?.email}</p>
                <p><strong>Full Name:</strong> {selectedUser?.kyc.fullName}</p>
                <p><strong>DOB:</strong> {selectedUser?.kyc.dateOfBirth ? new Date(selectedUser.kyc.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Gender:</strong> {selectedUser?.kyc.gender}</p>
                <p><strong>ID Type:</strong> {selectedUser?.kyc.governmentId?.type?.toUpperCase()}</p>
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
