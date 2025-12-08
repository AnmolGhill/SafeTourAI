import React, { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiChevronDown, FiCheck } from 'react-icons/fi';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/LanguageSelector.css';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Available languages with their native names and flags
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' }
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (languageCode) => {
    changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg 
                   bg-gray-50 hover:bg-gray-100 transition-colors duration-200
                   border border-gray-200 hover:border-gray-300
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        title={t('language.selectLanguage', 'Select Language')}
      >
        {/* Globe Icon for Desktop, Flag for Mobile */}
        <div className="flex items-center">
          <span className="hidden sm:block">
            <FiGlobe className="w-4 h-4 text-gray-600" />
          </span>
          <span className="sm:hidden text-lg">
            {currentLang.flag}
          </span>
        </div>
        
        {/* Language Code/Name - Responsive */}
        <span className="hidden lg:block text-sm font-medium text-gray-700">
          {currentLang.nativeName}
        </span>
        <span className="lg:hidden text-sm font-medium text-gray-700">
          {currentLang.code.toUpperCase()}
        </span>
        
        {/* Dropdown Arrow */}
        <FiChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50
                        max-h-80 overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">
              {t('language.selectLanguage', 'Select Language')}
            </p>
          </div>

          {/* Language Options */}
          <div className="py-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left
                           hover:bg-gray-50 transition-colors duration-150
                           ${currentLanguage === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{language.flag}</span>
                  <div>
                    <p className="text-sm font-medium">{language.nativeName}</p>
                    <p className="text-xs text-gray-500">{language.name}</p>
                  </div>
                </div>
                
                {currentLanguage === language.code && (
                  <FiCheck className="w-4 h-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              {t('language.currentLanguage', 'Current Language')}: {currentLang.nativeName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
