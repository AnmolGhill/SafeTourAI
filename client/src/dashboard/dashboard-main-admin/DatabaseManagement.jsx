import React from 'react';
import { FiDatabase, FiHardDrive, FiRefreshCw, FiDownload } from 'react-icons/fi';

const DatabaseManagement = () => {
  const dbStats = [
    {
      title: 'Total Records',
      value: '45,234',
      icon: FiDatabase,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Storage Used',
      value: '2.3 GB',
      icon: FiHardDrive,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Last Backup',
      value: '2 hours ago',
      icon: FiDownload,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Sync Status',
      value: 'Up to date',
      icon: FiRefreshCw,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100'
    }
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Database Management</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-4">
        {dbStats.map((stat, index) => (
          <div key={index} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-6 h-6 ${stat.bgColor} rounded flex items-center justify-center`}>
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-gray-700">{stat.title}</span>
            </div>
            <div className={`text-sm font-semibold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <button className="w-full btn btn-primary text-sm py-2">
          Create Backup
        </button>
        <button className="w-full btn btn-secondary text-sm py-2">
          Optimize Database
        </button>
      </div>
    </div>
  );
};

export default DatabaseManagement;
