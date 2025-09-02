import React, { useState } from 'react';
import { FiPlus, FiFileText, FiMapPin, FiClock, FiUser } from 'react-icons/fi';

const IncidentReporting = () => {
  const [showForm, setShowForm] = useState(false);
  const [incidents] = useState([
    {
      id: 1,
      title: 'Lost Tourist',
      type: 'missing_person',
      severity: 'high',
      location: 'Beach Area',
      time: '14:30',
      officer: 'Officer Smith',
      status: 'investigating'
    },
    {
      id: 2,
      title: 'Document Theft',
      type: 'theft',
      severity: 'medium',
      location: 'Market District',
      time: '12:15',
      officer: 'Officer Johnson',
      status: 'resolved'
    }
  ]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Incident Reports</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary text-sm flex items-center space-x-2"
        >
          <FiPlus className="w-4 h-4" />
          <span>New Report</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-3">Create Incident Report</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Incident title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Select incident type</option>
              <option>Missing Person</option>
              <option>Theft</option>
              <option>Medical Emergency</option>
              <option>Suspicious Activity</option>
            </select>
            <textarea
              placeholder="Description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            ></textarea>
            <div className="flex space-x-2">
              <button className="btn btn-primary">Submit Report</button>
              <button 
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {incidents.map((incident) => (
          <div key={incident.id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{incident.title}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(incident.severity)}`}>
                {incident.severity}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <FiMapPin className="w-3 h-3" />
                <span>{incident.location}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FiClock className="w-3 h-3" />
                <span>{incident.time}</span>
              </span>
              <span className="flex items-center space-x-1">
                <FiUser className="w-3 h-3" />
                <span>{incident.officer}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncidentReporting;
