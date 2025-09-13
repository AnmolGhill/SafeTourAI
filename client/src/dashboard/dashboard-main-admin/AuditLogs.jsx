import React, { useState } from 'react';
import { FiActivity, FiSearch, FiDownload, FiFilter } from 'react-icons/fi';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  const [auditLogs] = useState([
    {
      id: 1,
      timestamp: '2024-08-31 17:30:15',
      user: 'Admin Johnson',
      action: 'KYC_APPROVED',
      resource: 'User ID: USR001',
      details: 'KYC verification approved for John Doe',
      ipAddress: '192.168.1.10',
      severity: 'info'
    },
    {
      id: 2,
      timestamp: '2024-08-31 17:25:42',
      user: 'Officer Smith',
      action: 'ID_SCANNED',
      resource: 'Tourist Profile: Maria Garcia',
      details: 'Digital ID scanned and verified',
      ipAddress: '192.168.1.25',
      severity: 'info'
    },
    {
      id: 3,
      timestamp: '2024-08-31 17:20:33',
      user: 'System',
      action: 'BACKUP_COMPLETED',
      resource: 'Database',
      details: 'Automated database backup completed successfully',
      ipAddress: 'localhost',
      severity: 'info'
    },
    {
      id: 4,
      timestamp: '2024-08-31 17:15:18',
      user: 'Unknown',
      action: 'LOGIN_FAILED',
      resource: 'Admin Panel',
      details: 'Failed login attempt with invalid credentials',
      ipAddress: '203.0.113.45',
      severity: 'warning'
    },
    {
      id: 5,
      timestamp: '2024-08-31 17:10:07',
      user: 'Admin Johnson',
      action: 'USER_CREATED',
      resource: 'User ID: USR004',
      details: 'New user account created for Ahmed Hassan',
      ipAddress: '192.168.1.10',
      severity: 'info'
    },
    {
      id: 6,
      timestamp: '2024-08-31 17:05:52',
      user: 'System',
      action: 'SECURITY_SCAN',
      resource: 'System',
      details: 'Security vulnerability scan initiated',
      ipAddress: 'localhost',
      severity: 'info'
    }
  ]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || log.severity === filterType;
    return matchesSearch && matchesFilter;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'info': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionColor = (action) => {
    if (action.includes('FAILED') || action.includes('ERROR')) return 'text-red-600';
    if (action.includes('APPROVED') || action.includes('COMPLETED')) return 'text-green-600';
    if (action.includes('CREATED') || action.includes('UPDATED')) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Audit Logs</h2>
        <p className="text-gray-600">Complete system activity and security audit trail</p>
      </div>

      {/* Controls */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <button className="btn btn-secondary flex items-center space-x-2">
            <FiDownload className="w-4 h-4" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Timestamp</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">User</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Action</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Resource</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Details</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">IP Address</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Severity</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">{log.timestamp}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">{log.user}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.resource}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{log.ipAddress}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(log.severity)}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FiActivity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No audit logs found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{auditLogs.filter(l => l.severity === 'info').length}</div>
          <div className="text-sm text-gray-600">Info Events</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-yellow-600">{auditLogs.filter(l => l.severity === 'warning').length}</div>
          <div className="text-sm text-gray-600">Warnings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{auditLogs.filter(l => l.severity === 'error').length}</div>
          <div className="text-sm text-gray-600">Errors</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-600">{auditLogs.length}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
