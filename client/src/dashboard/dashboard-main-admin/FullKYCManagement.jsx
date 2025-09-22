import React, { useState } from 'react';
import { FiSearch, FiUser, FiShield, FiCheck, FiX, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';

const FullKYCManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKYC, setSelectedKYC] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [kycRecords] = useState([
    {
      id: 1,
      userId: 'USR001',
      name: 'John Doe',
      email: 'john.doe@email.com',
      nationality: 'USA',
      documentType: 'Passport',
      documentNumber: 'P123456789',
      status: 'verified',
      submissionDate: '2024-08-25',
      verificationDate: '2024-08-26',
      verifiedBy: 'Admin Smith',
      riskScore: 'Low',
      documents: ['passport.jpg', 'selfie.jpg', 'proof_of_address.pdf']
    },
    {
      id: 2,
      userId: 'USR002',
      name: 'Maria Garcia',
      email: 'maria.garcia@email.com',
      nationality: 'Spain',
      documentType: 'National ID',
      documentNumber: 'ES987654321',
      status: 'pending',
      submissionDate: '2024-08-30',
      verificationDate: null,
      verifiedBy: null,
      riskScore: 'Medium',
      documents: ['national_id.jpg', 'selfie.jpg']
    },
    {
      id: 3,
      userId: 'USR003',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      nationality: 'Egypt',
      documentType: 'Passport',
      documentNumber: 'EG456789123',
      status: 'rejected',
      submissionDate: '2024-08-28',
      verificationDate: '2024-08-29',
      verifiedBy: 'Admin Johnson',
      riskScore: 'High',
      documents: ['passport.jpg', 'selfie.jpg'],
      rejectionReason: 'Document quality insufficient'
    }
  ]);

  const filteredRecords = kycRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.documentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleApprove = (id) => {
    console.log('Approving KYC:', id);
    // Implementation for approval
  };

  const handleReject = (id) => {
    console.log('Rejecting KYC:', id);
    // Implementation for rejection
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Full KYC Management</h2>
        <p className="text-gray-600">Complete access to all KYC verification records and controls</p>
      </div>

      {/* Filters and Search */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search KYC records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>Total: {kycRecords.length}</span>
            <span>Pending: {kycRecords.filter(r => r.status === 'pending').length}</span>
            <span>Verified: {kycRecords.filter(r => r.status === 'verified').length}</span>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* KYC Records List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">KYC Records</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                onClick={() => setSelectedKYC(record)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{record.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(record.riskScore)}`}>
                      {record.riskScore}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>ID: {record.userId}</p>
                  <p>Document: {record.documentType} - {record.documentNumber}</p>
                  <p>Submitted: {record.submissionDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* KYC Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">KYC Details</h3>
          
          {selectedKYC ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-bold text-gray-800">{selectedKYC.name}</h4>
                  <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedKYC.status)}`}>
                    {selectedKYC.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600">{selectedKYC.email}</p>
                <p className="text-sm text-gray-500">User ID: {selectedKYC.userId}</p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nationality</label>
                    <p className="font-semibold">{selectedKYC.nationality}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Risk Score</label>
                    <span className={`inline-block text-sm px-2 py-1 rounded-full ${getRiskColor(selectedKYC.riskScore)}`}>
                      {selectedKYC.riskScore}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Document Information</label>
                  <div className="space-y-1">
                    <p><span className="font-semibold">Type:</span> {selectedKYC.documentType}</p>
                    <p><span className="font-semibold">Number:</span> {selectedKYC.documentNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Submission Date</label>
                    <p className="font-semibold">{selectedKYC.submissionDate}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Verification Date</label>
                    <p className="font-semibold">{selectedKYC.verificationDate || 'Pending'}</p>
                  </div>
                </div>

                {selectedKYC.verifiedBy && (
                  <div>
                    <label className="text-sm text-gray-600">Verified By</label>
                    <p className="font-semibold">{selectedKYC.verifiedBy}</p>
                  </div>
                )}

                {selectedKYC.rejectionReason && (
                  <div>
                    <label className="text-sm text-gray-600">Rejection Reason</label>
                    <p className="font-semibold text-red-600">{selectedKYC.rejectionReason}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-600">Submitted Documents</label>
                  <div className="space-y-2 mt-2">
                    {selectedKYC.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{doc}</span>
                        <button className="text-blue-600 hover:text-blue-800">
                          <FiEye className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedKYC.status === 'pending' && (
                <div className="flex space-x-2 pt-4 border-t">
                  <button 
                    onClick={() => handleApprove(selectedKYC.id)}
                    className="btn btn-primary flex items-center space-x-2 flex-1"
                  >
                    <FiCheck className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button 
                    onClick={() => handleReject(selectedKYC.id)}
                    className="btn btn-danger flex items-center space-x-2 flex-1"
                  >
                    <FiX className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </div>
              )}

              {selectedKYC.status !== 'pending' && (
                <div className="flex space-x-2 pt-4 border-t">
                  <button className="btn btn-secondary flex items-center space-x-2">
                    <FiEdit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button className="btn btn-danger flex items-center space-x-2">
                    <FiTrash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiShield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a KYC record to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullKYCManagement;
