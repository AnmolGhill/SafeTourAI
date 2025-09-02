import React from 'react';
import { FiUsers, FiAlertTriangle, FiCheckCircle, FiEye } from 'react-icons/fi';

const SubAdminStatsCards = () => {
  const stats = [
    {
      title: 'Tourists Verified Today',
      value: '47',
      change: '+12%',
      changeType: 'positive',
      icon: FiUsers,
      iconBg: 'bg-blue-500'
    },
    {
      title: 'Active Incidents',
      value: '3',
      change: '-2 from yesterday',
      changeType: 'positive',
      icon: FiAlertTriangle,
      iconBg: 'bg-red-500'
    },
    {
      title: 'ID Scans Completed',
      value: '128',
      change: '+8%',
      changeType: 'positive',
      icon: FiCheckCircle,
      iconBg: 'bg-green-500'
    },
    {
      title: 'Profiles Accessed',
      value: '89',
      change: '+15%',
      changeType: 'positive',
      icon: FiEye,
      iconBg: 'bg-yellow-500'
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

export default SubAdminStatsCards;
