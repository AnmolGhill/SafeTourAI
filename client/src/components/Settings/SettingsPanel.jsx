import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import authService from '../../services/authService';
import notificationService from '../../services/notificationService';
import { 
  CogIcon, 
  BellIcon, 
  ShieldCheckIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const SettingsPanel = () => {
  const [profile, setProfile] = useState({});
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      shareLocation: true,
      allowEmergencyAccess: true
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile();
      setProfile(data);
      if (data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await authService.updateProfile({
        ...profile,
        preferences
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationTest = async () => {
    try {
      await notificationService.sendTestNotification({
        title: 'Test Notification',
        body: 'This is a test notification from SafeTourAI'
      });
      toast.success('Test notification sent');
    } catch (error) {
      toast.error('Failed to send test notification');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
          <CogIcon className="h-8 w-8 text-gray-500 mr-3" />
          Settings
        </h2>
      </div>

      <form onSubmit={handleProfileUpdate} className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-6 w-6 text-blue-500 mr-2" />
            Profile Information
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({...profile, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({...profile, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={profile.role || 'user'}
                onChange={(e) => setProfile({...profile, role: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="user">Regular User</option>
                <option value="responder">Emergency Responder</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <BellIcon className="h-6 w-6 text-yellow-500 mr-2" />
              Notification Preferences
            </h3>
            <button
              type="button"
              onClick={handleNotificationTest}
              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition duration-200"
            >
              Test
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">Receive emergency alerts via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.email}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      email: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive real-time push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.push}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      push: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600">Receive emergency alerts via SMS</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.sms}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    notifications: {
                      ...preferences.notifications,
                      sms: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <ShieldCheckIcon className="h-6 w-6 text-green-500 mr-2" />
            Privacy Settings
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Share Location</h4>
                <p className="text-sm text-gray-600">Allow location sharing for emergency services</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.privacy.shareLocation}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    privacy: {
                      ...preferences.privacy,
                      shareLocation: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Emergency Access</h4>
                <p className="text-sm text-gray-600">Allow emergency responders to access your data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.privacy.allowEmergencyAccess}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    privacy: {
                      ...preferences.privacy,
                      allowEmergencyAccess: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="h-6 w-6 text-purple-500 mr-2" />
            System Information
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-gray-900">{profile.userId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span className="text-gray-900">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Login:</span>
              <span className="text-gray-900">
                {profile.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email Verified:</span>
              <span className={`font-medium ${profile.isEmailVerified ? 'text-green-600' : 'text-red-600'}`}>
                {profile.isEmailVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone Verified:</span>
              <span className={`font-medium ${profile.isPhoneVerified ? 'text-green-600' : 'text-red-600'}`}>
                {profile.isPhoneVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">KYC Status:</span>
              <span className={`font-medium ${
                profile.kyc?.status === 'verified' ? 'text-green-600' :
                profile.kyc?.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {profile.kyc?.status || 'Not Started'}
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleProfileUpdate}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition duration-200 ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
          }`}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
