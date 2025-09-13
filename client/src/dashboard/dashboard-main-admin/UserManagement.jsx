import React, { useState } from 'react';
import { FiSearch, FiUser, FiEdit, FiTrash2, FiPlus, FiShield, FiLock } from 'react-icons/fi';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState('all');
  
  const mockUsers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'tourist',
      status: 'active',
      joinDate: '2024-08-25',
      kycStatus: 'verified',
      country: 'USA'
    },
    {
      id: 2,
      name: 'Admin User',
      email: 'admin@safetourai.com',
      role: 'sub-admin',
      status: 'active',
      joinDate: '2024-07-15',
      kycStatus: 'verified',
      country: 'Local'
    },
    {
      id: 3,
      name: 'Super Admin',
      email: 'superadmin@safetourai.com',
      role: 'admin',
      status: 'active',
      joinDate: '2024-06-01',
      kycStatus: 'verified',
      country: 'Local'
    },
    {
      id: 4,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'tourist',
      status: 'inactive',
      joinDate: '2024-08-28',
      kycStatus: 'pending',
      country: 'Spain'
    }
  ];

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-purple-600 bg-purple-100';
      case 'sub-admin': return 'text-blue-600 bg-blue-100';
      case 'tourist': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      case 'suspended': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getKycColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">User Management</h2>
        <p className="text-gray-600">Manage all system users, roles, and permissions</p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="sub-admin">Sub-Admin</option>
              <option value="tourist">Tourist</option>
            </select>
          </div>

          <button className="btn btn-primary flex items-center space-x-2">
            <FiPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* Users List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Users</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{user.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>{user.email}</p>
                  <p>Joined: {user.joinDate}</p>
                  <div className="flex items-center justify-between">
                    <span>KYC:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getKycColor(user.kycStatus)}`}>
                      {user.kycStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Details</h3>
          
          {selectedUser ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-bold text-gray-800">{selectedUser.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm px-3 py-1 rounded-full ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role.toUpperCase()}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(selectedUser.status)}`}>
                      {selectedUser.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600">{selectedUser.email}</p>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Country</label>
                    <p className="font-semibold">{selectedUser.country}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">KYC Status</label>
                    <span className={`inline-block text-sm px-2 py-1 rounded-full ${getKycColor(selectedUser.kycStatus)}`}>
                      {selectedUser.kycStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Join Date</label>
                  <p className="font-semibold">{selectedUser.joinDate}</p>
                </div>

                {/* Role Permissions */}
                <div>
                  <label className="text-sm text-gray-600">Role Permissions</label>
                  <div className="mt-2 space-y-2">
                    {selectedUser.role === 'admin' && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <FiShield className="w-4 h-4 text-purple-600" />
                          <span>Full system access</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <FiLock className="w-4 h-4 text-purple-600" />
                          <span>User management</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <FiShield className="w-4 h-4 text-purple-600" />
                          <span>KYC management</span>
                        </div>
                      </div>
                    )}
                    {selectedUser.role === 'sub-admin' && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <FiShield className="w-4 h-4 text-blue-600" />
                          <span>ID scanning access</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <FiUser className="w-4 h-4 text-blue-600" />
                          <span>Tourist profile access</span>
                        </div>
                      </div>
                    )}
                    {selectedUser.role === 'tourist' && (
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <FiUser className="w-4 h-4 text-green-600" />
                          <span>Profile management</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <FiShield className="w-4 h-4 text-green-600" />
                          <span>Emergency services</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <button className="btn btn-primary flex items-center space-x-2 flex-1">
                  <FiEdit className="w-4 h-4" />
                  <span>Edit User</span>
                </button>
                <button className="btn btn-secondary">
                  Reset Password
                </button>
                <button className="btn btn-danger">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
