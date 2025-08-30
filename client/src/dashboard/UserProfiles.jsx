import React, { useState } from 'react';
import { 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiHeart, 
  FiShield, 
  FiSettings,
  FiEdit3
} from 'react-icons/fi';

const UserProfiles = () => {
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');

  const [userProfile, setUserProfile] = useState({
    fullName: 'John Doe',
    age: 28,
    dateOfBirth: '1995-03-15',
    gender: 'Male',
    contactNumber: '+1-555-0123',
    email: 'john.doe@safetour.ai',
    address: '123 Main Street, Downtown, City 12345',
    emergencyContacts: [
      { name: 'Jane Doe', phone: '+1-555-0124', relation: 'Spouse' },
      { name: 'Robert Doe', phone: '+1-555-0125', relation: 'Father' }
    ],
    bloodGroup: 'O+',
    allergies: 'Peanuts, Shellfish',
    medicalConditions: 'None',
    disabilities: 'None',
    medications: 'None',
    sosPreference: 'Button',
    privacySettings: 'Family Only',
    blockchainConsent: true,
    riskScore: 85,
    safetyTips: [
      'Avoid traveling alone after 10 PM',
      'Keep emergency contacts updated',
      'Share live location during long trips'
    ],
    disabilitySupport: false,
    safeWord: 'RAINBOW',
    travelInsurance: 'Policy #INS123456'
  });

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FiUser },
    { id: 'emergency', label: 'Emergency Contacts', icon: FiPhone },
    { id: 'health', label: 'Health & Safety', icon: FiHeart },
    { id: 'security', label: 'Security Settings', icon: FiShield },
    { id: 'ai', label: 'AI Features', icon: FiSettings },
    { id: 'optional', label: 'Additional', icon: FiSettings }
  ];

  const handleSave = () => {
    console.log('Saving profile:', userProfile);
    setEditMode(false);
    alert('✅ Profile updated successfully!');
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            value={userProfile.fullName}
            onChange={(e) => setUserProfile(prev => ({ ...prev, fullName: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
          <input
            type="tel"
            value={userProfile.contactNumber}
            onChange={(e) => setUserProfile(prev => ({ ...prev, contactNumber: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={userProfile.email}
            onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
          <select
            value={userProfile.bloodGroup}
            onChange={(e) => setUserProfile(prev => ({ ...prev, bloodGroup: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'basic':
        return renderBasicInfo();
      case 'emergency':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Emergency Contacts</h3>
            {userProfile.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-800">{contact.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-gray-800">{contact.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                    <p className="text-gray-800">{contact.relation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'health':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Health Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-medium text-red-800">Allergies</h4>
                <p className="text-red-600">{userProfile.allergies}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Medical Conditions</h4>
                <p className="text-blue-600">{userProfile.medicalConditions}</p>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Security Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">SOS Trigger</h4>
                <p className="text-green-600">{userProfile.sosPreference}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Privacy Level</h4>
                <p className="text-purple-600">{userProfile.privacySettings}</p>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">AI Personalization</h3>
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-gray-700">Safety Score</span>
                <span className="text-2xl font-bold text-purple-600">{userProfile.riskScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                  style={{ width: `${userProfile.riskScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        );
      case 'optional':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Additional Details</h3>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800">Safe Word</h4>
              <p className="text-yellow-600">Configured for disguised SOS alerts</p>
            </div>
          </div>
        );
      default:
        return renderBasicInfo();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-teal-500 rounded-full flex items-center justify-center">
                <FiUser className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">User Profile</h1>
                <p className="text-gray-600">Manage your personal information and safety settings</p>
              </div>
            </div>
            
            <button
              onClick={editMode ? handleSave : () => setEditMode(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit3 className="w-4 h-4" />
              <span>{editMode ? 'Save' : 'Edit'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex overflow-x-auto">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors duration-200 whitespace-nowrap
                    ${isActive 
                      ? 'border-blue-600 text-blue-600 bg-blue-50' 
                      : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {renderSectionContent()}
        </div>
      </div>
    </div>
  );
};

export default UserProfiles;
