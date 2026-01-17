import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMic, 
  FiMicOff, 
  FiAlertTriangle, 
  FiPhone, 
  FiMail, 
  FiMapPin, 
  FiUsers, 
  FiSettings,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiLoader,
  FiVolumeX,
  FiVolume2,
  FiX,
  FiCheck,
  FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { emergencyAPI } from '../../config/api';

const EmergencyVoiceTrigger = () => {
  // Voice detection states
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [triggerWord, setTriggerWord] = useState('help');
  const [customTriggerWords, setCustomTriggerWords] = useState(['help', 'sos', 'emergency']);
  
  // Emergency states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [alertSent, setAlertSent] = useState(false);
  const [silentMode, setSilentMode] = useState(false);
  const [location, setLocation] = useState(null);
  
  // Contact management
  const [familyContacts, setFamilyContacts] = useState([]);
  const [voiceHistory, setVoiceHistory] = useState([]);
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '', primary: false });
  
  // Loading states
  const [dataLoading, setDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const countdownRef = useRef(null);

  // Initialize component
  useEffect(() => {
    initializeVoiceRecognition();
    getCurrentLocation();
    loadInitialData();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load initial data from API
  const loadInitialData = async () => {
    try {
      setDataLoading(true);
      
      // Load contacts and voice history in parallel
      const [contactsResult, historyResult] = await Promise.all([
        emergencyAPI.getContacts(),
        emergencyAPI.getVoiceHistory()
      ]);
      
      setFamilyContacts(contactsResult.data || []);
      setVoiceHistory(historyResult.data || []);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Failed to load emergency data');
    } finally {
      setDataLoading(false);
    }
  };

  // Initialize voice recognition
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        checkForTriggerWords(transcript.toLowerCase());
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsProcessing(false);
        toast.error('Voice recognition error. Please try again.');
      };
      
      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart recognition if it was supposed to be listening
          setTimeout(() => {
            if (isListening) {
              recognitionRef.current.start();
            }
          }, 100);
        }
      };
    } else {
      toast.error('Voice recognition not supported in this browser');
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Location access denied. Emergency alerts will be sent without location.');
        }
      );
    }
  };

  // Initialize audio visualization
  const initializeAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
      
      microphoneRef.current.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateVoiceLevel = () => {
        if (analyserRef.current && isListening) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setVoiceLevel(average);
          requestAnimationFrame(updateVoiceLevel);
        }
      };
      
      updateVoiceLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Microphone access denied');
    }
  };

  // Check for trigger words
  const checkForTriggerWords = (transcript) => {
    const foundTrigger = customTriggerWords.find(word => 
      transcript.includes(word.toLowerCase())
    );
    
    if (foundTrigger) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsListening(false);
        triggerEmergencyAlert();
      }, 1000);
    }
  };

  // Start/stop listening
  const toggleListening = async () => {
    if (isListening) {
      // Stop listening
      setIsListening(false);
      setVoiceLevel(0);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    } else {
      // Start listening
      setIsListening(true);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      await initializeAudioVisualization();
    }
  };

  // Trigger emergency alert
  const triggerEmergencyAlert = () => {
    if (silentMode) {
      sendEmergencyAlert();
    } else {
      setShowConfirmation(true);
      setCountdown(5);
      
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setShowConfirmation(false);
            sendEmergencyAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Send emergency alert
  const sendEmergencyAlert = async () => {
    setIsLoading(true);
    
    try {
      const primaryContacts = familyContacts.filter(contact => contact.primary);
      
      if (primaryContacts.length === 0) {
        toast.error('No primary emergency contacts configured');
        setIsLoading(false);
        return;
      }

      const alertData = {
        triggerWord: triggerWord,
        location: location,
        contacts: primaryContacts,
        silentMode: silentMode,
        emergencyType: 'voice_trigger'
      };

      const result = await emergencyAPI.createVoiceAlert(alertData);
      
      setAlertSent(true);
      toast.success(`Emergency alert sent to ${primaryContacts.length} contacts!`);
      
      // Refresh voice history
      const historyResult = await emergencyAPI.getVoiceHistory();
      setVoiceHistory(historyResult.data || []);
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      
      setTimeout(() => {
        setAlertSent(false);
      }, 5000);
      
    } catch (error) {
      console.error('Error sending alert:', error);
      toast.error('Failed to send emergency alert: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel emergency alert
  const cancelAlert = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setShowConfirmation(false);
    setCountdown(5);
    toast.success('Emergency alert cancelled');
  };

  // Contact management functions
  const addContact = async () => {
    if (!newContact.name || !newContact.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const contact = {
        id: Date.now(),
        ...newContact
      };
      
      const updatedContacts = [...familyContacts, contact];
      await emergencyAPI.saveContacts(updatedContacts);
      
      setFamilyContacts(updatedContacts);
      setNewContact({ name: '', phone: '', relationship: '', primary: false });
      setShowContactForm(false);
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const editContact = (contact) => {
    setEditingContact(contact);
    setNewContact(contact);
    setShowContactForm(true);
  };

  const updateContact = async () => {
    try {
      const updatedContacts = familyContacts.map(contact => 
        contact.id === editingContact.id ? { ...newContact } : contact
      );
      
      await emergencyAPI.saveContacts(updatedContacts);
      
      setFamilyContacts(updatedContacts);
      setEditingContact(null);
      setNewContact({ name: '', phone: '', relationship: '', primary: false });
      setShowContactForm(false);
      toast.success('Contact updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    }
  };

  const deleteContact = async (id) => {
    try {
      const updatedContacts = familyContacts.filter(contact => contact.id !== id);
      await emergencyAPI.saveContacts(updatedContacts);
      
      setFamilyContacts(updatedContacts);
      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  // Test emergency alert
  const testEmergencyAlert = async (contact) => {
    try {
      setIsLoading(true);
      await emergencyAPI.testAlert(contact.id);
      toast.success(`Test alert sent to ${contact.name}`);
    } catch (error) {
      console.error('Error sending test alert:', error);
      toast.error('Failed to send test alert');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-300 rounded animate-pulse mb-2 w-64"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
        </div>

        {/* Main Button Skeleton */}
        <div className="flex justify-center mb-8">
          <div className="w-64 h-64 bg-gray-300 rounded-full animate-pulse"></div>
        </div>

        {/* Controls Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-6 bg-gray-300 rounded animate-pulse mb-4 w-32"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="h-6 bg-gray-300 rounded animate-pulse mb-4 w-40"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>

        {/* Contacts Skeleton */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="h-6 bg-gray-300 rounded animate-pulse mb-4 w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-5 bg-gray-300 rounded animate-pulse mb-2 w-32"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-700">Processing emergency alert...</p>
          </div>
        </div>
      )}
    </div>
  );

  // Show loading skeleton while data is being fetched
  if (dataLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Emergency Voice Trigger</h1>
          <p className="text-gray-600">Press the button and speak your emergency trigger word</p>
        </div>

        {/* Main Voice Button */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Waveform Animation */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-64 h-64 border-4 border-green-400 rounded-full animate-ping"
                    style={{
                      animationDelay: `${i * 0.5}s`,
                      opacity: Math.max(0.1, voiceLevel / 255),
                      transform: `scale(${1 + (voiceLevel / 255) * 0.5})`
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Main Button */}
            <button
              onClick={toggleListening}
              disabled={isProcessing}
              className={`
                relative w-64 h-64 rounded-full flex items-center justify-center
                transition-all duration-300 transform hover:scale-105
                ${isListening 
                  ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-200' 
                  : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200'
                }
                ${isProcessing ? 'animate-pulse' : ''}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {isProcessing ? (
                <FiLoader className="w-16 h-16 text-white animate-spin" />
              ) : isListening ? (
                <FiMic className="w-16 h-16 text-white" />
              ) : (
                <FiMicOff className="w-16 h-16 text-white" />
              )}
            </button>
            
            {/* Status Text */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
              <p className={`font-semibold ${isListening ? 'text-green-600' : 'text-gray-600'}`}>
                {isProcessing ? 'Processing...' : isListening ? 'Listening...' : 'Press to Activate'}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Voice Settings */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiSettings className="w-5 h-5 mr-2" />
              Voice Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Words
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {customTriggerWords.map((word, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add custom trigger word"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      setCustomTriggerWords(prev => [...prev, e.target.value.trim().toLowerCase()]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Silent Alert Mode</span>
                <button
                  onClick={() => setSilentMode(!silentMode)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${silentMode ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${silentMode ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Location Status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FiMapPin className="w-5 h-5 mr-2" />
              Location Status
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${location ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-700">
                  {location ? 'Location Available' : 'Location Unavailable'}
                </span>
              </div>
              
              {location && (
                <div className="text-xs text-gray-500">
                  <p>Lat: {location.latitude.toFixed(6)}</p>
                  <p>Lng: {location.longitude.toFixed(6)}</p>
                  <p>Accuracy: ±{location.accuracy}m</p>
                </div>
              )}
              
              <button
                onClick={getCurrentLocation}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Location
              </button>
            </div>
          </div>
        </div>

        {/* Family Contacts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiUsers className="w-5 h-5 mr-2" />
              Emergency Contacts
            </h3>
            <button
              onClick={() => setShowContactForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            {familyContacts.map((contact) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-800">{contact.name}</h4>
                        {contact.primary && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{contact.relationship}</p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <FiPhone className="w-3 h-3 mr-1" />
                        {contact.phone}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => testEmergencyAlert(contact)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Test Alert"
                    >
                      <FiMail className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editContact(contact)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteContact(contact.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency History */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiClock className="w-5 h-5 mr-2" />
            Recent Emergency Triggers
          </h3>
          
          {voiceHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiAlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No emergency triggers recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {voiceHistory.slice(0, 10).map((trigger, index) => (
                <div key={trigger.id || index} className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        trigger.status === 'sent' ? 'bg-green-500' : 
                        trigger.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-800">Trigger: "{trigger.triggerWord}"</p>
                        <p className="text-sm text-gray-500">
                          {new Date(trigger.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trigger.status === 'sent' ? 'bg-green-100 text-green-800' :
                      trigger.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trigger.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <FiAlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Send Emergency Alert?</h3>
            <p className="text-gray-600 mb-6">
              Emergency alert will be sent in <span className="font-bold text-red-600">{countdown}</span> seconds
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={cancelAlert}
                className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center"
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={() => {
                  clearInterval(countdownRef.current);
                  setShowConfirmation(false);
                  sendEmergencyAlert();
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center"
              >
                <FiCheck className="w-4 h-4 mr-2" />
                Send Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Form Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md mx-4 w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                <select
                  value={newContact.relationship}
                  onChange={(e) => setNewContact(prev => ({ ...prev, relationship: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="primary"
                  checked={newContact.primary}
                  onChange={(e) => setNewContact(prev => ({ ...prev, primary: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="primary" className="text-sm text-gray-700">
                  Primary emergency contact
                </label>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowContactForm(false);
                  setEditingContact(null);
                  setNewContact({ name: '', phone: '', relationship: '', primary: false });
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={editingContact ? updateContact : addContact}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingContact ? 'Update' : 'Add'} Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {alertSent && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <FiCheck className="w-5 h-5" />
          <span>Emergency alert sent successfully!</span>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <FiLoader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-700">Sending emergency alert...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyVoiceTrigger;
