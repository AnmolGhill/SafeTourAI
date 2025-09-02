import React, { useState } from 'react';
import { FiSearch, FiUser, FiMapPin, FiPhone, FiCalendar, FiFlag, FiShield } from 'react-icons/fi';

const TouristProfileViewer = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [tourists] = useState([
    {
      id: 1,
      name: 'John Doe',
      idNumber: 'ID123456',
      nationality: 'USA',
      age: 35,
      phone: '+1 555 123 4567',
      email: 'john.doe@email.com',
      checkInDate: '2024-08-25',
      checkOutDate: '2024-09-05',
      accommodation: 'Grand Hotel Central',
      travelPurpose: 'Tourism',
      emergencyContact: 'Jane Doe - +1 555 987 6543',
      status: 'active',
      lastSeen: '2024-08-31 14:30',
      riskLevel: 'low'
    },
    {
      id: 2,
      name: 'Maria Garcia',
      idNumber: 'ID789012',
      nationality: 'Spain',
      age: 28,
      phone: '+34 123 456 789',
      email: 'maria.garcia@email.com',
      checkInDate: '2024-08-28',
      checkOutDate: '2024-09-10',
      accommodation: 'Beach Resort Hotel',
      travelPurpose: 'Tourism',
      emergencyContact: 'Carlos Garcia - +34 987 654 321',
      status: 'active',
      lastSeen: '2024-08-31 16:15',
      riskLevel: 'low'
    },
    {
      id: 3,
      name: 'Ahmed Hassan',
      idNumber: 'ID345678',
      nationality: 'Egypt',
      age: 42,
      phone: '+20 123 456 789',
      email: 'ahmed.hassan@email.com',
      checkInDate: '2024-08-30',
      checkOutDate: '2024-09-15',
      accommodation: 'City Center Inn',
      travelPurpose: 'Business',
      emergencyContact: 'Fatima Hassan - +20 987 654 321',
      status: 'flagged',
      lastSeen: '2024-08-31 12:00',
      riskLevel: 'medium'
    }
  ]);

  const filteredTourists = tourists.filter(tourist =>
    tourist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tourist.idNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tourist.nationality.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'flagged': return 'text-red-600 bg-red-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tourist Profiles</h2>
        <p className="text-gray-600">Access and manage tourist profile information</p>
      </div>

      <div className="grid-2 mb-6">
        {/* Tourist List */}
        <div className="card">
          <div className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tourists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredTourists.map((tourist) => (
              <div
                key={tourist.id}
                onClick={() => setSelectedProfile(tourist)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{tourist.name}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tourist.status)}`}>
                    {tourist.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>ID: {tourist.idNumber}</p>
                  <p>Nationality: {tourist.nationality}</p>
                  <div className="flex items-center justify-between">
                    <span>Risk Level:</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(tourist.riskLevel)}`}>
                      {tourist.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Details</h3>
          
          {selectedProfile ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedProfile.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{selectedProfile.name}</h4>
                  <p className="text-gray-600">{selectedProfile.idNumber}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(selectedProfile.status)}`}>
                      {selectedProfile.status}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(selectedProfile.riskLevel)}`}>
                      {selectedProfile.riskLevel} risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Nationality</label>
                    <p className="font-semibold">{selectedProfile.nationality}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Age</label>
                    <p className="font-semibold">{selectedProfile.age}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Contact Information</label>
                  <div className="space-y-1">
                    <p className="font-semibold flex items-center space-x-2">
                      <FiPhone className="w-4 h-4" />
                      <span>{selectedProfile.phone}</span>
                    </p>
                    <p className="text-gray-700">{selectedProfile.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Travel Information</label>
                  <div className="space-y-1">
                    <p><span className="font-semibold">Purpose:</span> {selectedProfile.travelPurpose}</p>
                    <p><span className="font-semibold">Check-in:</span> {selectedProfile.checkInDate}</p>
                    <p><span className="font-semibold">Check-out:</span> {selectedProfile.checkOutDate}</p>
                    <p className="flex items-center space-x-2">
                      <FiMapPin className="w-4 h-4" />
                      <span>{selectedProfile.accommodation}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Emergency Contact</label>
                  <p className="font-semibold">{selectedProfile.emergencyContact}</p>
                </div>

                <div>
                  <label className="text-sm text-gray-600">Last Seen</label>
                  <p className="font-semibold">{selectedProfile.lastSeen}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t">
                <button className="btn btn-primary flex-1">
                  Update Status
                </button>
                <button className="btn btn-secondary">
                  Flag Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FiUser className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a tourist profile to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TouristProfileViewer;
