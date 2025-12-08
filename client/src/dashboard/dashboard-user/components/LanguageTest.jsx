import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageTest = () => {
  const { t, currentLanguage } = useLanguage();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Language Test Component</h3>
      <div className="space-y-2">
        <p><strong>Current Language:</strong> {currentLanguage}</p>
        <p><strong>Dashboard:</strong> {t('nav.dashboard', 'Dashboard')}</p>
        <p><strong>Settings:</strong> {t('nav.settings', 'Settings')}</p>
        <p><strong>Emergency SOS:</strong> {t('nav.emergencySos', 'Emergency SOS')}</p>
        <p><strong>System Status:</strong> {t('welcome.systemStatus', 'System Status')}</p>
        <p><strong>Loading:</strong> {t('common.loading', 'Loading...')}</p>
        <p><strong>Success:</strong> {t('common.success', 'Success')}</p>
      </div>
    </div>
  );
};

export default LanguageTest;
