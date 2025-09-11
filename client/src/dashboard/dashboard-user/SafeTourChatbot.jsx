import React, { useState, useRef, useEffect } from 'react';
import { 
  FiMessageCircle, 
  FiSend, 
  FiX, 
  FiMinimize2, 
  FiMaximize2,
  FiMapPin,
  FiAlertTriangle,
  FiShield,
  FiHeart,
  FiGlobe,
  FiUsers,
  FiWifi,
  FiPhone,
  FiSettings
} from 'react-icons/fi';

const SafeTourChatbot = ({ activeTab, setActiveTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '🧭 Welcome to SafeTourAI Chatbot! I\'m here to help you stay safe while traveling. You can ask me about travel safety, emergencies, cultural tips, and much more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const promptCategories = [
    {
      id: 'safety',
      title: 'Travel Safety',
      icon: FiShield,
      color: 'bg-blue-500',
      prompts: [
        'Provide me real-time safety tips for [city/country]',
        'Tell me about common scams in [location]',
        'What are the safest areas to stay in [city]?',
        'What are the emergency numbers in [country]?'
      ]
    },
    {
      id: 'emergency',
      title: 'Emergency Assistance',
      icon: FiAlertTriangle,
      color: 'bg-red-500',
      prompts: [
        'Help me create an SOS message with my current location',
        'What should I do if I lose my passport in [country]?',
        'Give me step-by-step instructions in case of a medical emergency abroad'
      ]
    },
    {
      id: 'cultural',
      title: 'Cultural Awareness',
      icon: FiGlobe,
      color: 'bg-green-500',
      prompts: [
        'Tell me about cultural do\'s and don\'ts in [country]',
        'What local laws should tourists be careful about in [location]?',
        'Suggest safe transportation options in [city]'
      ]
    },
    {
      id: 'health',
      title: 'Health & Safety',
      icon: FiHeart,
      color: 'bg-pink-500',
      prompts: [
        'What vaccinations are recommended before traveling to [country]?',
        'List the nearest hospitals or clinics in [city]',
        'What should I do if I get food poisoning while traveling?'
      ]
    },
    {
      id: 'alerts',
      title: 'Travel Alerts',
      icon: FiMapPin,
      color: 'bg-orange-500',
      prompts: [
        'Are there any travel advisories for [location]?',
        'Give me weather and natural disaster alerts for [city]',
        'Update me on political or protest-related risks in [country]'
      ]
    },
    {
      id: 'solo',
      title: 'Solo Traveler Safety',
      icon: FiUsers,
      color: 'bg-purple-500',
      prompts: [
        'Give safety tips for solo women travelers in [location]',
        'What safe accommodations are recommended for solo travelers in [city]?',
        'How can I avoid unsafe situations while traveling alone?'
      ]
    },
    {
      id: 'cyber',
      title: 'Cybersecurity',
      icon: FiWifi,
      color: 'bg-indigo-500',
      prompts: [
        'How do I protect my data when using public WiFi abroad?',
        'What are safe payment methods to use in [country]?',
        'How to detect fake booking websites or scams?'
      ]
    },
    {
      id: 'communication',
      title: 'Communication Help',
      icon: FiPhone,
      color: 'bg-teal-500',
      prompts: [
        'Translate this emergency message into [local language]',
        'Teach me basic emergency phrases in [language]',
        'What apps or helplines can help in [country]?'
      ]
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call the Gemini API
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        })
      });

      const data = await response.json();

      if (data.success) {
        const botResponse = {
          id: Date.now() + 1,
          type: 'bot',
          content: data.response.content,
          category: data.response.category,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botResponse]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat API Error:', error);
      const errorResponse = {
        id: Date.now() + 1,
        type: 'bot',
        content: `🚨 I'm sorry, I'm having trouble connecting right now. Please try again in a moment. 

In the meantime, here are some quick safety reminders:
- Keep your documents secure
- Stay aware of your surroundings  
- Have emergency contacts ready
- Trust your instincts

For immediate emergencies, contact local emergency services directly.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };


  const handlePromptClick = (prompt) => {
    handleSendMessage(prompt);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-teal-500 
                   text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 
                   transition-all duration-200 flex items-center justify-center z-50"
      >
        <FiMessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <FiMessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">SafeTourAI Chatbot</h3>
              <p className="text-xs opacity-90">Your Travel Safety Assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              {isMinimized ? <FiMaximize2 className="w-4 h-4" /> : <FiMinimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Quick Prompts */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick Safety Topics:</p>
              <div className="grid grid-cols-4 gap-1">
                {promptCategories.slice(0, 8).map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handlePromptClick(category.prompts[0])}
                    className="flex flex-col items-center p-2 rounded-lg hover:bg-white transition-colors duration-200 group"
                    title={category.title}
                  >
                    <div className={`w-6 h-6 ${category.color} rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform duration-200`}>
                      <category.icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-600 text-center leading-tight">{category.title.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask about travel safety, emergencies, or cultural tips..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SafeTourChatbot;
