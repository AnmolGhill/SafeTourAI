// SafeTourAI Gemini Prompts System
// Comprehensive travel safety prompts for AI chatbot

const SYSTEM_PROMPT = `You are SafeTourAI Assistant, an expert travel safety advisor specializing in:
- Emergency response and crisis management
- Travel safety and security guidance
- Cultural awareness and local customs
- Health and medical travel advice
- Solo travel safety (especially for women)
- Cybersecurity while traveling
- Scam prevention and fraud awareness
- Communication assistance and translation help

Always provide:
1. Accurate, actionable safety advice
2. Location-specific information when possible
3. Emergency contact information
4. Step-by-step instructions for safety procedures
5. Cultural sensitivity and respect

Format responses with clear headings, bullet points, and emojis for better readability.
Keep responses comprehensive but concise. Always prioritize user safety.`;

const PROMPT_CATEGORIES = {
  TRAVEL_SAFETY: {
    category: 'travel_safety',
    prompts: {
      general_safety: `Provide comprehensive travel safety tips for {location}. Include:
- General safety precautions
- Safe transportation options
- Recommended areas to stay/avoid
- Local emergency numbers
- Cultural considerations
- Common safety risks specific to this location`,

      scam_prevention: `Detail common travel scams in {location} and prevention strategies:
- Most frequent tourist scams
- Warning signs to watch for
- How to avoid being targeted
- What to do if scammed
- Local authorities to contact
- Prevention tips specific to this destination`,

      safe_areas: `Identify the safest areas in {location} for tourists:
- Recommended neighborhoods for accommodation
- Safe areas for walking day/night
- Areas to avoid and why
- Transportation safety between areas
- Local safety resources and contacts`,

      emergency_numbers: `Provide complete emergency contact information for {location}:
- Local emergency services numbers
- Police, fire, medical emergency
- Tourist police if available
- Embassy/consulate contacts
- Travel insurance emergency lines
- Local hospitals and clinics`
    }
  },

  EMERGENCY_ASSISTANCE: {
    category: 'emergency_assistance',
    prompts: {
      sos_creation: `Help create an emergency SOS message for {location}:
- Current location details
- Nature of emergency
- Contact information
- Medical conditions if relevant
- Emergency contacts to notify
- Local emergency services to contact`,

      lost_passport: `Provide step-by-step guide for lost passport in {location}:
- Immediate actions to take
- Local police reporting procedures
- Embassy/consulate contact and process
- Required documents for replacement
- Temporary travel document options
- Prevention tips for future travel`,

      medical_emergency: `Emergency medical response guide for {location}:
- How to call local emergency services
- Nearest hospitals and clinics
- Medical phrases in local language
- Travel insurance procedures
- Embassy medical assistance
- Medication replacement procedures`
    }
  },

  CULTURAL_AWARENESS: {
    category: 'cultural_awareness',
    prompts: {
      cultural_etiquette: `Comprehensive cultural guide for {location}:
- Essential do's and don'ts
- Greeting customs and social etiquette
- Dress code expectations
- Religious and cultural sensitivities
- Business etiquette if applicable
- Tipping customs and practices`,

      local_laws: `Important legal information for tourists in {location}:
- Laws tourists commonly violate unknowingly
- Photography restrictions
- Alcohol and drug laws
- Import/export restrictions
- Traffic and driving laws
- Penalties for common violations`,

      transportation_safety: `Safe transportation guide for {location}:
- Recommended transportation methods
- Official taxi services and ride-sharing
- Public transportation safety tips
- Airport transfer options
- Driving safety and requirements
- Transportation scams to avoid`
    }
  },

  HEALTH_SAFETY: {
    category: 'health_safety',
    prompts: {
      vaccinations: `Health preparation guide for {location}:
- Required and recommended vaccinations
- Health risks and prevention
- Recommended travel health insurance
- Prescription medication guidelines
- Health facilities and standards
- Food and water safety precautions`,

      medical_facilities: `Medical facilities and services in {location}:
- Major hospitals and clinics
- English-speaking medical facilities
- Emergency medical services
- Pharmacy locations and hours
- Medical tourism options if applicable
- Health insurance acceptance`,

      food_safety: `Food and water safety guide for {location}:
- Safe eating and drinking practices
- Foods and drinks to avoid
- Restaurant safety tips
- Street food safety guidelines
- Water purification methods
- Common foodborne illnesses and symptoms`
    }
  },

  SOLO_TRAVEL: {
    category: 'solo_travel',
    prompts: {
      solo_safety: `Solo travel safety guide for {location}:
- General solo travel precautions
- Safe accommodation options
- Meeting people safely
- Transportation safety for solo travelers
- Emergency preparedness
- Communication and check-in strategies`,

      women_safety: `Women's safety guide for {location}:
- Cultural considerations for women
- Safe areas and times for solo exploration
- Appropriate dress codes
- Harassment prevention and response
- Women-only accommodations if available
- Local women's safety resources`,

      accommodation_safety: `Safe accommodation guide for solo travelers in {location}:
- Recommended hotel/hostel areas
- Safety features to look for
- Booking safety tips
- Room safety checks
- Solo traveler-friendly accommodations
- Budget vs safety considerations`
    }
  },

  CYBERSECURITY: {
    category: 'cybersecurity',
    prompts: {
      wifi_security: `Cybersecurity guide for travelers in {location}:
- Public WiFi safety practices
- VPN recommendations and setup
- Secure communication methods
- Device security best practices
- Data backup strategies
- Cyber threat awareness`,

      payment_security: `Payment security guide for {location}:
- Safe payment methods
- ATM safety and locations
- Credit card vs cash usage
- Currency exchange safety
- Digital payment options
- Fraud prevention measures`,

      scam_detection: `Digital scam prevention for {location}:
- Common online travel scams
- Fake booking website detection
- Email and SMS scam awareness
- Social media safety while traveling
- Identity theft prevention
- Recovery procedures if compromised`
    }
  },

  COMMUNICATION: {
    category: 'communication',
    prompts: {
      emergency_phrases: `Essential emergency phrases for {location}:
- "Help me" in local language
- Medical emergency phrases
- Police and fire emergency phrases
- "I don't speak [language]" phrase
- Numbers and basic directions
- Phonetic pronunciation guide`,

      translation_help: `Communication assistance for {location}:
- Key phrases for daily interactions
- Emergency communication methods
- Translation app recommendations
- Local language basics
- Cultural communication norms
- Non-verbal communication tips`,

      local_apps: `Helpful apps and services for {location}:
- Transportation apps
- Translation and communication apps
- Emergency and safety apps
- Local service apps (food, accommodation)
- Offline map applications
- Government and tourist information apps`
    }
  }
};

const RESPONSE_TEMPLATES = {
  SAFETY_ALERT: `🚨 **SAFETY ALERT** 🚨
{content}

**Immediate Actions:**
{actions}

**Emergency Contacts:**
{contacts}`,

  STEP_BY_STEP: `📋 **Step-by-Step Guide**

{steps}

**Important Notes:**
{notes}

**Additional Resources:**
{resources}`,

  CULTURAL_GUIDE: `🌍 **Cultural Guide**

**Essential Information:**
{essentials}

**Do's and Don'ts:**
✅ **DO:**
{dos}

❌ **DON'T:**
{donts}

**Local Tips:**
{tips}`,

  EMERGENCY_RESPONSE: `🚨 **Emergency Response Protocol**

**Immediate Actions:**
1. {action1}
2. {action2}
3. {action3}

**Contact Information:**
{contacts}

**Follow-up Steps:**
{followup}`
};

const generatePrompt = (category, type, location = '', additionalContext = '') => {
  const categoryData = PROMPT_CATEGORIES[category];
  if (!categoryData || !categoryData.prompts[type]) {
    return null;
  }

  let prompt = SYSTEM_PROMPT + '\n\n';
  prompt += categoryData.prompts[type].replace(/{location}/g, location);
  
  if (additionalContext) {
    prompt += `\n\nAdditional Context: ${additionalContext}`;
  }

  return prompt;
};

const getPromptByKeywords = (message) => {
  const lowerMessage = message.toLowerCase();
  
  // Emergency keywords
  if (lowerMessage.includes('emergency') || lowerMessage.includes('sos') || lowerMessage.includes('help')) {
    return 'EMERGENCY_ASSISTANCE';
  }
  
  // Safety keywords
  if (lowerMessage.includes('safety') || lowerMessage.includes('safe') || lowerMessage.includes('secure')) {
    return 'TRAVEL_SAFETY';
  }
  
  // Scam keywords
  if (lowerMessage.includes('scam') || lowerMessage.includes('fraud') || lowerMessage.includes('cheat')) {
    return 'TRAVEL_SAFETY';
  }
  
  // Cultural keywords
  if (lowerMessage.includes('culture') || lowerMessage.includes('custom') || lowerMessage.includes('etiquette')) {
    return 'CULTURAL_AWARENESS';
  }
  
  // Health keywords
  if (lowerMessage.includes('health') || lowerMessage.includes('medical') || lowerMessage.includes('vaccination')) {
    return 'HEALTH_SAFETY';
  }
  
  // Solo travel keywords
  if (lowerMessage.includes('solo') || lowerMessage.includes('alone') || lowerMessage.includes('women')) {
    return 'SOLO_TRAVEL';
  }
  
  // Cyber keywords
  if (lowerMessage.includes('cyber') || lowerMessage.includes('wifi') || lowerMessage.includes('internet')) {
    return 'CYBERSECURITY';
  }
  
  // Communication keywords
  if (lowerMessage.includes('translate') || lowerMessage.includes('language') || lowerMessage.includes('phrase')) {
    return 'COMMUNICATION';
  }
  
  return 'TRAVEL_SAFETY'; // Default category
};

module.exports = {
  SYSTEM_PROMPT,
  PROMPT_CATEGORIES,
  RESPONSE_TEMPLATES,
  generatePrompt,
  getPromptByKeywords
};
