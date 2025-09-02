import React from 'react';
import { FiUsers, FiShield, FiDatabase, FiActivity } from 'react-icons/fi';

const AdminStatsCards = () => {
  const stats = [
    {
      title: 'Total System Users',
      value: '1,247',
      change: '+23 this week',
      changeType: 'positive',
      icon: FiUsers,
      iconBg: 'bg-blue-500'
    },
    {
      title: 'KYC Verifications',
      value: '892',
      change: '+15% this month',
      changeType: 'positive',
      icon: FiShield,
      iconBg: 'bg-green-500'
    },
    {
      title: 'Database Records',
      value: '45.2K',
      change: '+2.1K today',
      changeType: 'positive',
      icon: FiDatabase,
      iconBg: 'bg-purple-500'
    },
    {
      title: 'System Uptime',
      value: '99.8%',
      change: 'Last 30 days',
      changeType: 'positive',
      icon: FiActivity,
      iconBg: 'bg-teal-500'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-header">
            <div>
              <div className="stat-title">{stat.title}</div>
              <div className="stat-value">{stat.value}</div>
            </div>
            <div className={`stat-icon ${stat.iconBg}`}>
              <stat.icon className="text-white" />
            </div>
          </div>
          <div className={`stat-change ${stat.changeType}`}>
            <span>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStatsCards;
