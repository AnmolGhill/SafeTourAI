import React, { useState, useRef, useEffect } from 'react';
import { 
  FiSend, 
  FiMapPin,
  FiAlertTriangle,
  FiShield,
  FiHeart,
  FiGlobe,
  FiUsers,
  FiWifi,
  FiPhone
} from 'react-icons/fi';

const ChatbotPage = () => {
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

  return (
    <div className="animate-fadeIn h-full">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
            <FiAlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🧭 SafeTourAI Chatbot</h2>
            <p className="text-gray-600">Your intelligent travel safety assistant</p>
          </div>
        </div>
        
        {/* Quick Prompts */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-600 mb-3">Quick Safety Topics:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {promptCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handlePromptClick(category.prompts[0])}
                className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 group"
              >
                <div className={`w-8 h-8 ${category.color} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}>
                  <category.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-gray-600 text-center font-medium">{category.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="card h-96 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-t-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-200'
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
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
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
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about travel safety, emergencies, cultural tips, or any travel concerns..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-500 text-white rounded-lg hover:from-blue-700 hover:to-teal-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              <FiSend className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
