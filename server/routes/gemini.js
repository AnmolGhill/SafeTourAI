const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { 
  SYSTEM_PROMPT, 
  PROMPT_CATEGORIES, 
  RESPONSE_TEMPLATES, 
  generatePrompt, 
  getPromptByKeywords 
} = require('../utils/geminiPrompts');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Gemini AI Chat Route - Isolated from other server functions
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory, location } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env file.'
      });
    }

    // Generate contextual response using Gemini AI
    const response = await generateSafeTourResponse(message, conversationHistory, location);

    res.json({
      success: true,
      response: response.content,
      timestamp: new Date().toISOString(),
      promptCategory: response.category
    });

  } catch (error) {
    console.error('SafeTourAI Gemini Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get available prompt categories
router.get('/categories', (req, res) => {
  try {
    const categories = Object.keys(PROMPT_CATEGORIES).map(key => ({
      id: key.toLowerCase(),
      name: PROMPT_CATEGORIES[key].category,
      prompts: Object.keys(PROMPT_CATEGORIES[key].prompts)
    }));

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Categories Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// Health check for Gemini service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'SafeTourAI Gemini Service',
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Enhanced response generator for SafeTourAI using Gemini AI
async function generateSafeTourResponse(message, conversationHistory = [], location = '') {
  try {
    const promptCategory = getPromptByKeywords(message);
    const extractedLocation = location || extractLocationFromMessage(message);
    
    // Build context-aware prompt for Gemini
    let prompt = SYSTEM_PROMPT + '\n\n';
    
    // Add conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += 'Previous conversation context:\n';
      conversationHistory.slice(-3).forEach(msg => {
        prompt += `${msg.sender}: ${msg.text}\n`;
      });
      prompt += '\n';
    }
    
    // Add location context if available
    if (extractedLocation) {
      prompt += `Location context: ${extractedLocation}\n\n`;
    }
    
    // Add category-specific guidance
    prompt += `Category: ${promptCategory}\n`;
    prompt += `User message: ${message}\n\n`;
    prompt += `Please provide a comprehensive, safety-focused response with:
1. Clear, actionable advice
2. Location-specific information if applicable
3. Emergency contacts and procedures when relevant
4. Step-by-step instructions where appropriate
5. Cultural sensitivity and awareness
6. Use emojis and formatting for better readability

Respond as SafeTourAI, focusing on travel safety and security.`;

    // Generate response using Gemini AI
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      category: promptCategory.toLowerCase()
    };

  } catch (error) {
    console.error('Gemini AI Error:', error);
    
    // Fallback to mock response if Gemini fails
    const extractedLocation = location || extractLocationFromMessage(message);
    const promptCategory = getPromptByKeywords(message);
    
    switch (promptCategory) {
      case 'TRAVEL_SAFETY':
        return generateSafetyResponse(message, extractedLocation);
      case 'EMERGENCY_ASSISTANCE':
        return generateEmergencyResponse(message, extractedLocation);
      case 'CULTURAL_AWARENESS':
        return generateCulturalResponse(message, extractedLocation);
      case 'HEALTH_SAFETY':
        return generateHealthResponse(message, extractedLocation);
      case 'SOLO_TRAVEL':
        return generateSoloTravelResponse(message, extractedLocation);
      case 'CYBERSECURITY':
        return generateCyberSecurityResponse(message, extractedLocation);
      case 'COMMUNICATION':
        return generateCommunicationResponse(message, extractedLocation);
      default:
        return generateGeneralResponse(message, extractedLocation);
    }
  }
}

// Extract location from user message
function extractLocationFromMessage(message) {
  // Simple location extraction - can be enhanced with NLP
  const locationKeywords = ['in ', 'to ', 'at ', 'from ', 'visiting ', 'traveling to '];
  const lowerMessage = message.toLowerCase();
  
  for (const keyword of locationKeywords) {
    const index = lowerMessage.indexOf(keyword);
    if (index !== -1) {
      const afterKeyword = message.substring(index + keyword.length);
      const words = afterKeyword.split(' ');
      if (words.length > 0) {
        return words[0].replace(/[^\w\s]/gi, ''); // Remove punctuation
      }
    }
  }
  return '';
}

// Safety response generator
function generateSafetyResponse(message, location) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('scam') || lowerMessage.includes('fraud')) {
    return {
      content: `⚠️ **Travel Scam Prevention${location ? ` - ${location}` : ''}**

**Common Travel Scams:**
1. **Fake Police Scam** - Always ask for proper identification
2. **Overcharging Tourists** - Research local prices beforehand
3. **Distraction Theft** - Be aware of pickpockets in crowded areas
4. **Fake WiFi Networks** - Use VPN on public networks
5. **Currency Exchange Scams** - Use official exchange services

**Red Flags to Watch:**
🚩 Deals that seem too good to be true
🚩 Pressure to act immediately
🚩 Requests for personal information
🚩 Unofficial-looking documents or badges

**Protection Tips:**
✅ Trust your instincts
✅ Research common scams for your destination
✅ Keep emergency contacts handy
✅ Stay in well-lit, populated areas

${location ? `**Specific to ${location}:** Research local scam reports and tourist police contacts.` : ''}`,
      category: 'travel_safety'
    };
  }
  
  return {
    content: `🛡️ **Travel Safety Guidelines${location ? ` - ${location}` : ''}**

**Essential Safety Tips:**
1. **Stay Alert** - Always be aware of your surroundings
2. **Secure Documents** - Keep copies of important documents in separate locations
3. **Emergency Contacts** - Save local emergency numbers and embassy contacts
4. **Trusted Transportation** - Use official taxi services or ride-sharing apps
5. **Stay Connected** - Keep your phone charged with backup power sources

**Safety Checklist:**
✅ Research your destination beforehand
✅ Register with your embassy if traveling internationally
✅ Get comprehensive travel insurance
✅ Share your itinerary with trusted contacts
✅ Keep emergency cash in local currency

${location ? `**For ${location}:** Please specify for location-specific safety advice, emergency numbers, and local safety resources.` : '**For Location-Specific Advice:** Please mention your destination for tailored safety recommendations.'}`,
    category: 'travel_safety'
  };
}

// Emergency response generator
function generateEmergencyResponse(message, location) {
  return {
    content: `🚨 **Emergency Response Protocol${location ? ` - ${location}` : ''}**

**Immediate Actions:**
1. **Call Local Emergency Services**
   ${location ? `- Research ${location} emergency numbers` : '- International: 112 (works in most countries)'}
   - US/Canada: 911 | UK: 999 | Australia: 000

2. **Contact Your Embassy/Consulate**
   - They provide assistance with lost documents, legal issues, emergencies
   ${location ? `- Find ${location} embassy contact information` : ''}

3. **Notify Trusted Contacts**
   - Inform family/friends about your situation
   - Share your location if safe to do so

4. **Document Everything**
   - Take photos of incidents, damages, or injuries
   - Keep receipts and official reports
   - Get police report numbers

**Medical Emergency Steps:**
- Call local emergency services immediately
- Contact your travel insurance provider
- Locate nearest hospital or clinic
- Have your medical information ready

**Lost/Stolen Documents:**
- Report to local police immediately
- Contact your embassy for replacement documents
- Notify your bank and credit card companies

${location ? `**${location} Specific:** Contact local tourist police and emergency services for immediate assistance.` : ''}`,
    category: 'emergency_assistance'
  };
}

// Cultural response generator
function generateCulturalResponse(message, location) {
  return {
    content: `🌍 **Cultural Awareness Guide${location ? ` - ${location}` : ''}**

**General Cultural Tips:**

**Dress Code & Appearance:**
- Research local dress customs and religious requirements
- Dress modestly in religious sites and conservative areas
- Consider climate and cultural norms together

**Social Etiquette:**
- Learn basic greetings in the local language
- Understand tipping customs and expectations
- Respect personal space and social hierarchy norms

**Religious & Cultural Considerations:**
- Be aware of religious holidays and customs
- Follow photography restrictions in sacred places
- Respect local traditions and ceremonies

**Business & Dining Etiquette:**
- Understand meeting customs and punctuality expectations
- Learn about gift-giving protocols
- Know local dining customs and meal timing

**Common Cultural Mistakes to Avoid:**
❌ Pointing with index finger (use open hand instead)
❌ Showing soles of feet in some cultures
❌ Public displays of affection where inappropriate
❌ Ignoring local customs and dress codes

${location ? `**Specific to ${location}:** Research detailed cultural do's and don'ts, local laws, and social customs specific to this destination.` : '**For Detailed Guidance:** Please specify your destination for comprehensive cultural advice.'}`,
    category: 'cultural_awareness'
  };
}

// Health response generator
function generateHealthResponse(message, location) {
  return {
    content: `🏥 **Health & Medical Travel Guide${location ? ` - ${location}` : ''}**

**Pre-Travel Health Preparation:**

**Vaccinations & Medications:**
- Consult travel clinic 4-6 weeks before departure
- Check CDC/WHO recommendations for your destination
- Carry prescription medications in original containers
- Bring extra medication for potential delays

**Travel Health Kit Essentials:**
✅ First aid supplies and bandages
✅ Pain relievers and fever reducers
✅ Anti-diarrheal medication
✅ Hand sanitizer and disinfectant wipes
✅ Sunscreen and insect repellent
✅ Digital thermometer
✅ Prescription medications with extra supply

**Food & Water Safety:**
- Drink bottled or properly treated water
- Avoid ice in drinks unless from safe sources
- Eat hot, freshly cooked food
- Avoid raw or undercooked foods
- Peel fruits yourself when possible

**Common Travel Health Issues:**
1. **Traveler's Diarrhea** - Stay hydrated, use oral rehydration salts
2. **Jet Lag** - Adjust sleep schedule gradually before travel
3. **Altitude Sickness** - Ascend gradually, stay well hydrated
4. **Motion Sickness** - Take medication before travel begins

**Medical Emergency Preparation:**
- Research healthcare facilities at your destination
- Understand your travel insurance coverage details
- Carry medical information card with conditions/allergies
- Know how to contact local emergency medical services

${location ? `**For ${location}:** Research specific health risks, required vaccinations, healthcare quality, and medical facilities available.` : '**For Country-Specific Health Info:** Please specify your destination for tailored health recommendations and requirements.'}`,
    category: 'health_safety'
  };
}

// Solo travel response generator
function generateSoloTravelResponse(message, location) {
  return {
    content: `👤 **Solo Travel Safety Guide${location ? ` - ${location}` : ''}**

**Solo Travel Safety Essentials:**

**Pre-Trip Planning:**
- Share detailed itinerary with trusted contacts
- Research safe neighborhoods and accommodations
- Download offline maps and translation apps
- Set up regular check-in schedule with home base

**Accommodation Safety:**
- Choose well-reviewed accommodations in safe areas
- Request rooms on 2nd-6th floors (not ground floor)
- Check door locks, windows, and security features
- Trust your instincts about the area and staff

**Daily Safety Practices:**
- Stay constantly aware of your surroundings
- Avoid displaying expensive items or large amounts of cash
- Keep copies of important documents in multiple locations
- Carry emergency cash hidden in different places

**Women Solo Travelers - Additional Considerations:**
- Research cultural norms and expectations for women
- Dress according to local customs and conservative standards
- Avoid walking alone at night, especially in unfamiliar areas
- Trust your instincts about people and situations immediately
- Consider joining group tours for certain activities

**Communication & Check-ins:**
- Maintain regular contact with your home base
- Share live location when appropriate and safe
- Have local emergency contacts readily available
- Keep phone charged with backup power sources

**Transportation Safety:**
- Use official, licensed transportation services
- Sit near the driver in public transport when possible
- Avoid hitchhiking or accepting rides from strangers
- Pre-book airport transfers through reputable services

**Red Flags to Watch For:**
🚩 Someone following you or showing excessive interest
🚩 Overly friendly strangers asking personal questions
🚩 Pressure to go somewhere private or isolated
🚩 Drinks left unattended or offered by strangers

${location ? `**Specific to ${location}:** Research local solo travel safety, women's safety considerations, and cultural norms for solo travelers.` : ''}`,
    category: 'solo_travel'
  };
}

// Cybersecurity response generator
function generateCyberSecurityResponse(message, location) {
  return {
    content: `🔒 **Cybersecurity While Traveling${location ? ` - ${location}` : ''}**

**Public WiFi Safety:**

**Before Connecting:**
- Always verify network name with hotel/cafe staff
- Avoid networks without passwords or encryption
- Use VPN for all internet activity when possible
- Turn off auto-connect features on your devices

**Safe Browsing Practices:**
- Avoid accessing sensitive accounts (banking, email)
- Only use HTTPS websites (look for lock icon)
- Log out of all accounts when finished
- Clear browser data and cache regularly

**Device Security Measures:**
- Enable strong device lock screens with PINs/passwords
- Use unique, complex passwords for all accounts
- Enable two-factor authentication wherever possible
- Keep all software and apps updated to latest versions

**Payment & Financial Security:**
- Use secure payment methods (chip cards, contactless payments)
- Avoid using debit cards for purchases (use credit cards)
- Monitor accounts regularly for suspicious activity
- Notify banks of your travel plans in advance

**Data Protection Strategies:**
- Backup important data before traveling
- Use encrypted cloud storage services
- Avoid storing sensitive information on devices
- Consider using dedicated travel devices for extra security

**Common Cyber Threats While Traveling:**
⚠️ Fake WiFi hotspots designed to steal data
⚠️ Shoulder surfing in public spaces
⚠️ ATM skimming devices at tourist locations
⚠️ Malicious charging stations (juice jacking)
⚠️ Phishing emails and text messages

**Protective Measures:**
✅ Use reputable VPN service consistently
✅ Enable automatic screen locks with short timeouts
✅ Use secure messaging apps for communication
✅ Avoid public computers for sensitive tasks
✅ Carry portable charger to avoid public charging stations

**If Your Security is Compromised:**
1. Change all passwords immediately
2. Contact banks and credit card companies
3. Monitor all accounts for suspicious activity
4. Report incidents to local authorities if necessary
5. Contact your embassy if identity documents are compromised

${location ? `**For ${location}:** Research local cyber threats, internet restrictions, and digital safety considerations specific to this destination.` : ''}`,
    category: 'cybersecurity'
  };
}

// Communication response generator
function generateCommunicationResponse(message, location) {
  return {
    content: `📱 **Communication Help${location ? ` - ${location}` : ''}**

**Essential Emergency Phrases:**
${location ? `**For ${location}:**` : '**Universal Phrases:**'}
- "Help me" / "I need help"
- "Call the police" / "Call an ambulance"
- "I don't speak [local language]"
- "Where is the hospital?"
- "I am lost"
- "Emergency" / "This is an emergency"

**Communication Strategies:**

**Translation Tools:**
- Google Translate (works offline with downloaded languages)
- Microsoft Translator (real-time conversation translation)
- iTranslate (voice and text translation)
- Papago (excellent for Asian languages)

**Emergency Communication Methods:**
- International emergency number: 112 (works in most countries)
- Tourist police hotlines (often have English speakers)
- Embassy emergency contact numbers
- Hotel concierge or reception for assistance

**Helpful Apps for Travelers:**
📱 **Translation & Communication:**
- Google Translate, Microsoft Translator
- Duolingo for basic language learning
- SayHi Translate for voice translation

📱 **Emergency & Safety:**
- What3Words (precise location sharing)
- Red Cross Emergency App
- Local emergency service apps

📱 **Navigation & Local Info:**
- Google Maps (download offline maps)
- Maps.me (offline navigation)
- Citymapper (public transport in major cities)

**Non-Verbal Communication Tips:**
- Learn basic hand gestures (be aware some are offensive)
- Use pictures or drawings to communicate needs
- Point to phrases in phrasebooks or translation apps
- Use universal symbols and icons when possible

**Staying Connected:**
- Purchase local SIM card or international roaming plan
- Use messaging apps that work over WiFi (WhatsApp, Telegram)
- Keep important phone numbers written down physically
- Share your contact information with trusted locals (hotel staff)

${location ? `**Specific to ${location}:** Research local language basics, common phrases, cultural communication norms, and available communication services.` : '**For Language-Specific Help:** Please specify your destination for tailored communication assistance and local language phrases.'}`,
    category: 'communication'
  };
}

// General response generator
function generateGeneralResponse(message, location) {
  return {
    content: `🧭 **SafeTourAI Travel Assistant${location ? ` - ${location}` : ''}**

Thank you for reaching out! I'm here to help you stay safe while traveling.

**I can assist you with:**
🛡️ **Travel Safety** - General safety tips and location-specific advice
🚨 **Emergency Assistance** - Emergency protocols and contact information
🌍 **Cultural Awareness** - Local customs, etiquette, and cultural tips
🏥 **Health & Medical** - Vaccination info, health tips, and medical emergencies
👤 **Solo Travel Safety** - Special considerations for solo travelers
🔒 **Cybersecurity** - Digital safety and secure communication
📱 **Communication Help** - Translation and emergency phrases
⚠️ **Scam Prevention** - Common scams and how to avoid them

**To get specific help:**
- Mention your destination country/city
- Describe your travel situation (solo, group, business, leisure)
- Ask about specific safety concerns or scenarios

**Quick Examples:**
- "Safety tips for solo travel in Thailand"
- "Emergency numbers for Japan"
- "Cultural etiquette in Middle East"
- "How to avoid scams in tourist areas"
- "Cybersecurity tips for public WiFi"

${location ? `**For ${location}:** I can provide specific safety advice, emergency contacts, cultural tips, and local information for your destination.` : ''}

How can I help make your travels safer today?`,
    category: 'general'
  };
}

module.exports = router;
