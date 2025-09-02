import React, { useState, useEffect } from 'react';
import { useAuth } from '../../utils/auth';
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
  const [isLoading, setIsLoading] = useState(false);

  const [userProfile, setUserProfile] = useState({
    fullName: 'John Doe',
    age: 28,
    dateOfBirth: '1995-06-15',
    gender: 'Male',
    contactNumber: '+1 234 567 8900',
    email: 'john.doe@example.com',
    nationality: 'American',
    occupation: 'Software Engineer',
    address: '123 Main St, New York, NY 10001',
    riskScore: 85,
    emergencyContacts: [
      { name: 'Jane Doe', phone: '+1 234 567 8901', relation: 'Spouse', email: 'jane.doe@example.com' },
      { name: 'Robert Doe', phone: '+1 234 567 8902', relation: 'Father', email: 'robert.doe@example.com' }
    ],
    predictiveAlerts: true,
    smartRecommendations: true,
    behaviorAnalysis: false,
    voiceAssistant: true,
    aiLearningLevel: 'Moderate',
    aiNotificationFreq: 'Normal',
    safetyTips: [
      'Keep emergency contacts updated and accessible',
      'Share your location with trusted contacts when traveling',
      'Carry backup identification and emergency cash',
      'Research local emergency numbers for your destination',
      'Avoid traveling alone after 10 PM',
      'Share live location during long trips'
    ],
    bloodGroup: 'O+',
    allergies: 'Peanuts, Shellfish',
    medicalConditions: 'None',
    disabilities: 'None',
    medications: 'Aspirin 81mg daily',
    doctorName: 'Dr. Smith',
    doctorPhone: '+1-555-0130',
    healthInsurance: 'BlueCross #HC123456',
    medicalHistory: 'Appendectomy 2018, No major surgeries',
    chronicConditions: 'None',
    mentalHealthConditions: 'None',
    vaccinationStatus: 'Up to date - COVID, Flu, Hepatitis',
    organDonor: true,
    medicalAlerts: 'None',
    emergencyMedicalPreference: 'Nearest Hospital',
    mobilityAids: 'None',
    visionImpairment: false,
    hearingImpairment: false,
    sosPreference: 'Button',
    privacySettings: 'Family Only',
    blockchainConsent: true,
    disabilitySupport: false,
    safeWord: 'RAINBOW',
    travelInsurance: 'Policy #INS123456',
    travelStyle: 'Adventure',
    dietaryRestrictions: 'Vegetarian',
    accommodationPreference: 'Hotel'
  });

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FiUser },
    { id: 'emergency', label: 'Emergency Contacts', icon: FiPhone },
    { id: 'health', label: 'Health & Safety', icon: FiHeart },
    { id: 'security', label: 'Security Settings', icon: FiShield },
    { id: 'ai', label: 'AI Features', icon: FiSettings },
    { id: 'optional', label: 'Additional', icon: FiSettings }
  ];

  const { user, token } = useAuth();

  // Load user data from backend on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user && token) {
        try {
          // Fetch complete profile from backend
          const response = await fetch('http://localhost:5000/api/user/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const result = await response.json();
            // Merge backend data with defaults
            setUserProfile(prev => ({
              ...prev,
              ...result.user,
              fullName: result.user.name || result.user.fullName || prev.fullName,
              email: result.user.email || prev.email,
            }));
          } else {
            // Fallback to basic user data if profile fetch fails
            setUserProfile(prev => ({
              ...prev,
              fullName: user.name || prev.fullName,
              email: user.email || prev.email,
            }));
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Fallback to basic user data
          setUserProfile(prev => ({
            ...prev,
            fullName: user.name || prev.fullName,
            email: user.email || prev.email,
          }));
        }
      }
    };

    loadUserProfile();
  }, [user, token]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Save profile to backend Firebase
      const response = await fetch('http://localhost:5000/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const result = await response.json();
      console.log('Profile saved to Firebase:', result);
      
      setEditMode(false);
      alert('✅ Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('❌ Failed to save profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="number"
            value={userProfile.age}
            onChange={(e) => setUserProfile(prev => ({ ...prev, age: parseInt(e.target.value) }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
          <input
            type="date"
            value={userProfile.dateOfBirth}
            onChange={(e) => setUserProfile(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <select
            value={userProfile.gender}
            onChange={(e) => setUserProfile(prev => ({ ...prev, gender: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
          <input
            type="text"
            value={userProfile.nationality || 'American'}
            onChange={(e) => setUserProfile(prev => ({ ...prev, nationality: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
          <input
            type="text"
            value={userProfile.occupation || 'Software Engineer'}
            onChange={(e) => setUserProfile(prev => ({ ...prev, occupation: e.target.value }))}
            disabled={!editMode}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
          <textarea
            value={userProfile.address}
            onChange={(e) => setUserProfile(prev => ({ ...prev, address: e.target.value }))}
            disabled={!editMode}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
          />
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
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Emergency Contacts</h3>
              <p className="text-sm text-gray-600 mt-1">Add trusted contacts who will be notified during emergencies</p>
            </div>
            
            {userProfile.emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const newContacts = [...userProfile.emergencyContacts];
                          newContacts[index].name = e.target.value;
                          setUserProfile(prev => ({ ...prev, emergencyContacts: newContacts }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-800">{contact.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {editMode ? (
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => {
                          const newContacts = [...userProfile.emergencyContacts];
                          newContacts[index].phone = e.target.value;
                          setUserProfile(prev => ({ ...prev, emergencyContacts: newContacts }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-800">{contact.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                    {editMode ? (
                      <select
                        value={contact.relation}
                        onChange={(e) => {
                          const newContacts = [...userProfile.emergencyContacts];
                          newContacts[index].relation = e.target.value;
                          setUserProfile(prev => ({ ...prev, emergencyContacts: newContacts }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Spouse">Spouse</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Child">Child</option>
                        <option value="Friend">Friend</option>
                        <option value="Colleague">Colleague</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-gray-800">{contact.relation}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => {
                          const newContacts = [...userProfile.emergencyContacts];
                          newContacts[index].email = e.target.value;
                          setUserProfile(prev => ({ ...prev, emergencyContacts: newContacts }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-800">{contact.email || 'Not provided'}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {editMode && (
              <button
                onClick={() => {
                  setUserProfile(prev => ({
                    ...prev,
                    emergencyContacts: [...prev.emergencyContacts, { name: '', phone: '', relation: 'Friend', email: '' }]
                  }));
                }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                + Add Emergency Contact
              </button>
            )}
            
            {/* Important Information Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Why we collect emergency contacts:</h4>
                  <p className="text-sm text-blue-700">
                    When you press the SOS emergency button in our app, these contacts will be automatically notified via SMS and email with your location and emergency details. This ensures your loved ones are immediately informed and can provide assistance or contact emergency services on your behalf.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'health':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Health & Safety Information</h3>
              <p className="text-sm text-gray-600 mt-1">Complete medical information for emergency situations</p>
            </div>
            
            {/* Basic Health Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                {editMode ? (
                  <select
                    value={userProfile.bloodGroup}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <span className="text-red-800 font-medium">{userProfile.bloodGroup}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Health Insurance</label>
                {editMode ? (
                  <input
                    type="text"
                    value={userProfile.healthInsurance}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, healthInsurance: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Insurance provider and policy number"
                  />
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <span className="text-blue-800">{userProfile.healthInsurance}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Doctor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Doctor</label>
                {editMode ? (
                  <input
                    type="text"
                    value={userProfile.doctorName}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, doctorName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Doctor's name"
                  />
                ) : (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <span className="text-green-800">{userProfile.doctorName}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor's Phone</label>
                {editMode ? (
                  <input
                    type="tel"
                    value={userProfile.doctorPhone}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, doctorPhone: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Doctor's contact number"
                  />
                ) : (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <span className="text-green-800">{userProfile.doctorPhone}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Medical Conditions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                {editMode ? (
                  <textarea
                    value={userProfile.allergies}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, allergies: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List any allergies (food, medication, environmental)..."
                  />
                ) : (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <span className="text-red-800">{userProfile.allergies}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                {editMode ? (
                  <textarea
                    value={userProfile.medicalConditions}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, medicalConditions: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List any medical conditions..."
                  />
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <span className="text-blue-800">{userProfile.medicalConditions}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                {editMode ? (
                  <textarea
                    value={userProfile.chronicConditions}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, chronicConditions: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List any chronic conditions (diabetes, hypertension, etc.)..."
                  />
                ) : (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <span className="text-purple-800">{userProfile.chronicConditions}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
                {editMode ? (
                  <textarea
                    value={userProfile.medications}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, medications: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="List current medications with dosages..."
                  />
                ) : (
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <span className="text-yellow-800">{userProfile.medications}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mental Health Conditions</label>
                {editMode ? (
                  <textarea
                    value={userProfile.mentalHealthConditions}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, mentalHealthConditions: e.target.value }))}
                    rows="2"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Any mental health conditions or concerns..."
                  />
                ) : (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-800">{userProfile.mentalHealthConditions}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Medical History & Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
                {editMode ? (
                  <textarea
                    value={userProfile.medicalHistory}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, medicalHistory: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Previous surgeries, major illnesses, etc."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-800">{userProfile.medicalHistory}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vaccination Status</label>
                {editMode ? (
                  <textarea
                    value={userProfile.vaccinationStatus}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, vaccinationStatus: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Current vaccination status"
                  />
                ) : (
                  <div className="p-4 bg-teal-50 rounded-lg">
                    <span className="text-teal-800">{userProfile.vaccinationStatus}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Accessibility & Special Needs */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold text-gray-800">Accessibility & Special Needs</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobility Aids</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={userProfile.mobilityAids}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, mobilityAids: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Wheelchair, walker, cane, etc."
                    />
                  ) : (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <span className="text-orange-800">{userProfile.mobilityAids}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Medical Preference</label>
                  {editMode ? (
                    <select
                      value={userProfile.emergencyMedicalPreference}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, emergencyMedicalPreference: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Nearest Hospital">Nearest Hospital</option>
                      <option value="Preferred Hospital">Preferred Hospital</option>
                      <option value="Private Hospital">Private Hospital</option>
                      <option value="Government Hospital">Government Hospital</option>
                    </select>
                  ) : (
                    <div className="p-4 bg-pink-50 rounded-lg">
                      <span className="text-pink-800">{userProfile.emergencyMedicalPreference}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="visionImpairment"
                    checked={userProfile.visionImpairment}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, visionImpairment: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="visionImpairment" className="text-sm font-medium text-gray-700">
                    Vision Impairment
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="hearingImpairment"
                    checked={userProfile.hearingImpairment}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, hearingImpairment: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="hearingImpairment" className="text-sm font-medium text-gray-700">
                    Hearing Impairment
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="organDonor"
                    checked={userProfile.organDonor}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, organDonor: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="organDonor" className="text-sm font-medium text-gray-700">
                    Organ Donor
                  </label>
                </div>
              </div>
            </div>
            
            {/* Medical Alerts */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Medical Alerts</h4>
                  {editMode ? (
                    <textarea
                      value={userProfile.medicalAlerts}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, medicalAlerts: e.target.value }))}
                      rows="2"
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                      placeholder="Critical medical information for first responders..."
                    />
                  ) : (
                    <p className="text-sm text-yellow-700">{userProfile.medicalAlerts}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Security & Privacy Settings</h3>
              <p className="text-sm text-gray-600 mt-1">Configure your safety and privacy preferences</p>
            </div>
            
            {/* SOS & Emergency Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SOS Trigger Method</label>
                {editMode ? (
                  <select
                    value={userProfile.sosPreference}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, sosPreference: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Button">Physical Button</option>
                    <option value="Voice">Voice Command</option>
                    <option value="Shake">Shake Device</option>
                    <option value="Double Tap">Double Tap Screen</option>
                    <option value="Volume Keys">Volume Keys</option>
                  </select>
                ) : (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <span className="text-green-800 font-medium">{userProfile.sosPreference}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location Sharing</label>
                {editMode ? (
                  <select
                    value={userProfile.privacySettings}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, privacySettings: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Friends Only">Friends Only</option>
                    <option value="Family Only">Family Only</option>
                    <option value="Emergency Only">Emergency Only</option>
                    <option value="Private">Private</option>
                  </select>
                ) : (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <span className="text-purple-800 font-medium">{userProfile.privacySettings}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Security Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="twoFactorAuth"
                  checked={userProfile.twoFactorAuth || false}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="twoFactorAuth" className="text-sm font-medium text-gray-700">
                  Two-Factor Authentication
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="biometricAuth"
                  checked={userProfile.biometricAuth || false}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, biometricAuth: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="biometricAuth" className="text-sm font-medium text-gray-700">
                  Biometric Authentication
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="autoLock"
                  checked={userProfile.autoLock || true}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, autoLock: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoLock" className="text-sm font-medium text-gray-700">
                  Auto-lock Device
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="encryptData"
                  checked={userProfile.encryptData || true}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, encryptData: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="encryptData" className="text-sm font-medium text-gray-700">
                  Encrypt Personal Data
                </label>
              </div>
            </div>
            
            {/* Blockchain Consent */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="blockchainConsent"
                  checked={userProfile.blockchainConsent}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, blockchainConsent: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div>
                  <label htmlFor="blockchainConsent" className="text-sm font-medium text-blue-800">
                    Blockchain Data Storage Consent
                  </label>
                  <p className="text-sm text-blue-700 mt-1">
                    Allow secure storage of emergency data on blockchain for faster emergency response.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">AI Features & Personalization</h3>
              <p className="text-sm text-gray-600 mt-1">Configure AI-powered safety and personalization features</p>
            </div>
            
            {/* Safety Score */}
            <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-gray-700">AI Safety Score</span>
                <span className="text-2xl font-bold text-purple-600">{userProfile.riskScore}/100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                  style={{ width: `${userProfile.riskScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Based on your travel patterns, health profile, and safety preferences
              </p>
            </div>
            
            {/* AI Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="predictiveAlerts"
                  checked={userProfile.predictiveAlerts || true}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, predictiveAlerts: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="predictiveAlerts" className="text-sm font-medium text-gray-700">
                  Predictive Safety Alerts
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="smartRecommendations"
                  checked={userProfile.smartRecommendations || true}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, smartRecommendations: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="smartRecommendations" className="text-sm font-medium text-gray-700">
                  Smart Travel Recommendations
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="behaviorAnalysis"
                  checked={userProfile.behaviorAnalysis || false}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, behaviorAnalysis: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="behaviorAnalysis" className="text-sm font-medium text-gray-700">
                  Behavior Pattern Analysis
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="voiceAssistant"
                  checked={userProfile.voiceAssistant || true}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, voiceAssistant: e.target.checked }))}
                  disabled={!editMode}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="voiceAssistant" className="text-sm font-medium text-gray-700">
                  AI Voice Assistant
                </label>
              </div>
            </div>
            
            {/* AI Learning Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">AI Learning Level</label>
                {editMode ? (
                  <select
                    value={userProfile.aiLearningLevel || 'Moderate'}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, aiLearningLevel: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Minimal">Minimal</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Aggressive">Aggressive</option>
                    <option value="Custom">Custom</option>
                  </select>
                ) : (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <span className="text-purple-800">{userProfile.aiLearningLevel || 'Moderate'}</span>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
                {editMode ? (
                  <select
                    value={userProfile.aiNotificationFreq || 'Normal'}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, aiNotificationFreq: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Critical Only">Critical Only</option>
                  </select>
                ) : (
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <span className="text-indigo-800">{userProfile.aiNotificationFreq || 'Normal'}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* AI Safety Tips */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">AI-Generated Safety Tips</h4>
              <div className="space-y-2">
                {userProfile.safetyTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span className="text-sm text-green-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'optional':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Travel Preferences & Additional Details</h3>
              <p className="text-sm text-gray-600 mt-1">Customize your travel experience and notification preferences</p>
            </div>
            
            {/* Travel Preferences */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-blue-800 mb-4">Travel Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travel Style</label>
                  {editMode ? (
                    <select
                      value={userProfile.travelStyle || 'Adventure'}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, travelStyle: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Adventure">Adventure</option>
                      <option value="Leisure">Leisure</option>
                      <option value="Business">Business</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Eco-tourism">Eco-tourism</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Budget">Budget</option>
                    </select>
                  ) : (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">{userProfile.travelStyle || 'Adventure'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation Preference</label>
                  {editMode ? (
                    <select
                      value={userProfile.accommodationPref || 'Hotel'}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, accommodationPref: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hotel">Hotel</option>
                      <option value="Hostel">Hostel</option>
                      <option value="Airbnb">Airbnb</option>
                      <option value="Resort">Resort</option>
                      <option value="Camping">Camping</option>
                      <option value="Boutique Hotel">Boutique Hotel</option>
                      <option value="Guesthouse">Guesthouse</option>
                    </select>
                  ) : (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <span className="text-green-800">{userProfile.accommodationPref || 'Hotel'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Restrictions</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={userProfile.dietaryRestrictions || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                      placeholder="e.g., Vegetarian, Gluten-free, Halal"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <span className="text-orange-800">{userProfile.dietaryRestrictions || 'None specified'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range (per day)</label>
                  {editMode ? (
                    <select
                      value={userProfile.budgetRange || '$100-200'}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, budgetRange: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Under $50">Under $50</option>
                      <option value="$50-100">$50-100</option>
                      <option value="$100-200">$100-200</option>
                      <option value="$200-500">$200-500</option>
                      <option value="$500+">$500+</option>
                      <option value="No limit">No limit</option>
                    </select>
                  ) : (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <span className="text-purple-800">{userProfile.budgetRange || '$100-200'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Language Preferences</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={userProfile.languagePrefs || ''}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, languagePrefs: e.target.value }))}
                      placeholder="e.g., English, Spanish, French"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="p-4 bg-teal-50 rounded-lg">
                      <span className="text-teal-800">{userProfile.languagePrefs || 'English'}</span>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone Preference</label>
                  {editMode ? (
                    <select
                      value={userProfile.timeZonePref || 'Local time'}
                      onChange={(e) => setUserProfile(prev => ({ ...prev, timeZonePref: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Local time">Local time</option>
                      <option value="Home time zone">Home time zone</option>
                      <option value="UTC">UTC</option>
                      <option value="Both">Both</option>
                    </select>
                  ) : (
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <span className="text-indigo-800">{userProfile.timeZonePref || 'Local time'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Notification Preferences */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
              <h4 className="text-lg font-medium text-green-800 mb-4">Notification Preferences</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={userProfile.emailNotifications || true}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="smsNotifications"
                    checked={userProfile.smsNotifications || true}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="smsNotifications" className="text-sm font-medium text-gray-700">
                    SMS Notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="pushNotifications"
                    checked={userProfile.pushNotifications || true}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="pushNotifications" className="text-sm font-medium text-gray-700">
                    Push Notifications
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="emergencyAlerts"
                    checked={userProfile.emergencyAlerts || true}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, emergencyAlerts: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emergencyAlerts" className="text-sm font-medium text-gray-700">
                    Emergency Alerts
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="travelUpdates"
                    checked={userProfile.travelUpdates || true}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, travelUpdates: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="travelUpdates" className="text-sm font-medium text-gray-700">
                    Travel Updates
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="marketingEmails"
                    checked={userProfile.marketingEmails || false}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, marketingEmails: e.target.checked }))}
                    disabled={!editMode}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketingEmails" className="text-sm font-medium text-gray-700">
                    Marketing Emails
                  </label>
                </div>
              </div>
            </div>
            
            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              {editMode ? (
                <textarea
                  value={userProfile.additionalNotes || ''}
                  onChange={(e) => setUserProfile(prev => ({ ...prev, additionalNotes: e.target.value }))}
                  placeholder="Any additional information you'd like to share..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg min-h-[100px]">
                  <span className="text-gray-700">{userProfile.additionalNotes || 'No additional notes provided'}</span>
                </div>
              )}
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
          
          {/* Save Button at Bottom (when in edit mode) */}
          {editMode && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setEditMode(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiEdit3 className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfiles;
