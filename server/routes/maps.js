const express = require('express');
const axios = require('axios');
const { verifyFirebaseToken } = require('../middleware/auth');
const router = express.Router();

// Google Maps API configuration
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

// Geocoding endpoint - Convert place names to coordinates
router.post('/geocode', verifyFirebaseToken, async (req, res) => {
  try {
    const { address, placeQuery } = req.body;
    
    if (!address && !placeQuery) {
      return res.status(400).json({
        success: false,
        message: 'Address or place query is required'
      });
    }
    
    const query = address || placeQuery;
    const geocodeUrl = `${GOOGLE_MAPS_BASE_URL}/geocode/json`;
    
    const response = await axios.get(geocodeUrl, {
      params: {
        address: query,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      res.json({
        success: true,
        data: {
          coordinates: {
            lat: location.lat,
            lng: location.lng
          },
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
          addressComponents: result.address_components,
          viewport: result.geometry.viewport
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Location not found',
        status: response.data.status
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to geocode location',
      error: error.message
    });
  }
});

// Reverse geocoding endpoint - Convert coordinates to address
router.post('/reverse-geocode', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const reverseGeocodeUrl = `${GOOGLE_MAPS_BASE_URL}/geocode/json`;
    
    const response = await axios.get(reverseGeocodeUrl, {
      params: {
        latlng: `${lat},${lng}`,
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      res.json({
        success: true,
        data: {
          formattedAddress: result.formatted_address,
          addressComponents: result.address_components,
          placeId: result.place_id
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Address not found for coordinates',
        status: response.data.status
      });
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reverse geocode coordinates',
      error: error.message
    });
  }
});

// Nearby emergency services endpoint
router.post('/nearby-services', async (req, res) => {
  try {
    const { lat, lng, radius = 5000, types = ['police', 'hospital', 'fire_station', 'lodging'] } = req.body;
    
    console.log('🗺️  Google Maps API Request - Nearby Services:', { lat, lng, radius, types });
    
    if (!lat || !lng) {
      console.log('❌ Google Maps API Error: Missing coordinates');
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }
    
    const nearbySearchUrl = `${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`;
    console.log('🔗 Google Maps API Call:', nearbySearchUrl);
    console.log('🔑 Using Google Maps API Key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 12)}...` : 'NOT SET');
    
    const allServices = [];
    
    // Ensure types is an array
    const serviceTypes = Array.isArray(types) ? types : ['police', 'hospital', 'fire_station', 'lodging'];
    
    // Process each service type
    for (const type of serviceTypes) {
      try {
        const response = await axios.get(nearbySearchUrl, {
          params: {
            location: `${lat},${lng}`,
            radius: radius,
            type: type,
            key: GOOGLE_MAPS_API_KEY
          }
        });
        
        console.log(`📍 Google Maps API Response for ${type}:`, response.data.status, `(${response.data.results?.length || 0} results)`);
        
        if (response.data.status === 'OK' && response.data.results) {
          const services = response.data.results.slice(0, 3).map(place => ({
            id: place.place_id,
            name: place.name,
            type: type,
            coordinates: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng
            },
            distance: calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng),
            rating: place.rating || null,
            vicinity: place.vicinity || place.formatted_address || 'Unknown location',
            isOpen: place.opening_hours ? place.opening_hours.open_now : null,
            priceLevel: place.price_level || null,
            photos: place.photos ? place.photos.slice(0, 1).map(photo => ({
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            })) : []
          }));
          
          console.log(`✅ Found ${services.length} ${type} services:`, services.map(s => s.name));
          allServices.push(...services);
        } else {
          console.log(`⚠️  Google Maps API Status for ${type}:`, response.data.status, response.data.error_message || '');
        }
      } catch (typeError) {
        console.error(`❌ Error fetching ${type} services:`, typeError.response?.data || typeError.message);
        // Continue with other types even if one fails
      }
    }
    
    // Sort by distance
    allServices.sort((a, b) => a.distance - b.distance);
    
    console.log('🎯 Google Maps API Summary:', {
      totalServices: allServices.length,
      byType: {
        police: allServices.filter(s => s.type === 'police').length,
        hospital: allServices.filter(s => s.type === 'hospital').length,
        fire_station: allServices.filter(s => s.type === 'fire_station').length,
        lodging: allServices.filter(s => s.type === 'lodging').length
      }
    });
    
    res.json({
      success: true,
      data: {
        services: allServices,
        location: { lat, lng },
        radius: radius,
        totalFound: allServices.length
      }
    });
    
  } catch (error) {
    console.error('❌ Google Maps API Error - Nearby Services:', error.response?.data || error.message);
    console.error('🔍 Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby services',
      error: error.message
    });
  }
});

// Place details endpoint
router.get('/place-details/:placeId', verifyFirebaseToken, async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }
    
    const placeDetailsUrl = `${GOOGLE_MAPS_BASE_URL}/place/details/json`;
    
    const response = await axios.get(placeDetailsUrl, {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,formatted_phone_number,opening_hours,rating,reviews,website,photos,geometry',
        key: GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status === 'OK') {
      const place = response.data.result;
      
      res.json({
        success: true,
        data: {
          name: place.name,
          address: place.formatted_address,
          phone: place.formatted_phone_number,
          website: place.website,
          rating: place.rating,
          coordinates: place.geometry ? {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          } : null,
          openingHours: place.opening_hours ? {
            openNow: place.opening_hours.open_now,
            periods: place.opening_hours.periods,
            weekdayText: place.opening_hours.weekday_text
          } : null,
          reviews: place.reviews ? place.reviews.slice(0, 3) : [],
          photos: place.photos ? place.photos.slice(0, 3).map(photo => ({
            reference: photo.photo_reference,
            width: photo.width,
            height: photo.height
          })) : []
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Place details not found',
        status: response.data.status
      });
    }
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch place details',
      error: error.message
    });
  }
});

// Comprehensive travel safety analysis endpoint (AI integration point)
router.post('/safety-analysis', verifyFirebaseToken, async (req, res) => {
  try {
    const { lat, lng, destination, travelDate, activityType = 'general' } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates are required for safety analysis'
      });
    }
    
    // Parallel data fetching for comprehensive analysis
    const [locationResponse, nearbyServicesResponse, weatherResponse] = await Promise.all([
      // Get location details
      axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: GOOGLE_MAPS_API_KEY
        }
      }),
      // Get nearby emergency services
      axios.post(`${req.protocol}://${req.get('host')}/api/maps/nearby-services`, {
        lat,
        lng,
        radius: 10000, // 10km for safety analysis
        types: ['police', 'hospital', 'fire_station']
      }, {
        headers: {
          'Authorization': req.headers.authorization
        }
      }),
      // Get weather safety analysis
      axios.post(`${req.protocol}://${req.get('host')}/api/weather/safety-analysis`, {
        lat,
        lng,
        activityType
      }, {
        headers: {
          'Authorization': req.headers.authorization
        }
      })
    ]);
    
    let locationName = 'Unknown Location';
    if (locationResponse.data.status === 'OK' && locationResponse.data.results.length > 0) {
      locationName = locationResponse.data.results[0].formatted_address;
    }
    
    const emergencyServices = nearbyServicesResponse.data.success ? nearbyServicesResponse.data.data.services : [];
    const weatherData = weatherResponse.data.success ? weatherResponse.data.data : null;
    
    // Comprehensive safety score calculation
    const safetyAnalysis = calculateComprehensiveSafetyScore(emergencyServices, weatherData, lat, lng, activityType);
    
    res.json({
      success: true,
      data: {
        location: {
          coordinates: { lat, lng },
          name: locationName
        },
        overallSafetyScore: safetyAnalysis.overallScore,
        riskLevel: getRiskLevel(safetyAnalysis.overallScore),
        analysis: {
          infrastructure: {
            score: safetyAnalysis.infrastructureScore,
            emergencyServices: {
              total: emergencyServices.length,
              police: emergencyServices.filter(s => s.type === 'police').length,
              hospitals: emergencyServices.filter(s => s.type === 'hospital').length,
              fireStations: emergencyServices.filter(s => s.type === 'fire_station').length,
              nearest: emergencyServices.slice(0, 3)
            }
          },
          weather: weatherData ? {
            score: weatherData.riskAssessment.overallRisk,
            riskLevel: weatherData.riskAssessment.riskLevel,
            currentConditions: weatherData.currentWeather,
            factors: weatherData.riskAssessment.factors,
            forecast: weatherData.forecast.slice(0, 4)
          } : null,
          environmental: {
            score: safetyAnalysis.environmentalScore,
            factors: safetyAnalysis.environmentalFactors
          }
        },
        recommendations: safetyAnalysis.recommendations,
        alerts: safetyAnalysis.alerts,
        analysisDate: new Date().toISOString(),
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      }
    });
    
  } catch (error) {
    console.error('Safety analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform safety analysis',
      error: error.message
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Basic safety score calculation (placeholder for AI model)
function calculateBasicSafetyScore(emergencyServices, lat, lng) {
  let score = 50; // Base score
  
  // Increase score based on nearby emergency services
  const policeCount = emergencyServices.filter(s => s.type === 'police').length;
  const hospitalCount = emergencyServices.filter(s => s.type === 'hospital').length;
  const fireStationCount = emergencyServices.filter(s => s.type === 'fire_station').length;
  
  score += Math.min(policeCount * 10, 20);
  score += Math.min(hospitalCount * 15, 25);
  score += Math.min(fireStationCount * 5, 10);
  
  // Consider distance to nearest emergency service
  if (emergencyServices.length > 0) {
    const nearestDistance = Math.min(...emergencyServices.map(s => s.distance));
    if (nearestDistance < 2) score += 15;
    else if (nearestDistance < 5) score += 10;
    else if (nearestDistance < 10) score += 5;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

function getRiskLevel(score) {
  if (score >= 80) return 'low';
  if (score >= 60) return 'moderate';
  if (score >= 40) return 'high';
  return 'critical';
}

// Comprehensive safety score calculation with weather integration
function calculateComprehensiveSafetyScore(emergencyServices, weatherData, lat, lng, activityType) {
  let infrastructureScore = 50; // Base score
  let environmentalScore = 50;
  let weatherScore = weatherData ? (100 - weatherData.riskAssessment.overallRisk) : 50;
  
  const recommendations = [];
  const alerts = [];
  const environmentalFactors = [];
  
  // Infrastructure scoring (emergency services)
  const policeCount = emergencyServices.filter(s => s.type === 'police').length;
  const hospitalCount = emergencyServices.filter(s => s.type === 'hospital').length;
  const fireStationCount = emergencyServices.filter(s => s.type === 'fire_station').length;
  
  infrastructureScore += Math.min(policeCount * 10, 20);
  infrastructureScore += Math.min(hospitalCount * 15, 25);
  infrastructureScore += Math.min(fireStationCount * 5, 10);
  
  // Distance to nearest emergency service
  if (emergencyServices.length > 0) {
    const nearestDistance = Math.min(...emergencyServices.map(s => s.distance));
    if (nearestDistance < 2) infrastructureScore += 15;
    else if (nearestDistance < 5) infrastructureScore += 10;
    else if (nearestDistance < 10) infrastructureScore += 5;
    else {
      infrastructureScore -= 10;
      alerts.push('Nearest emergency services are more than 10km away');
    }
  } else {
    infrastructureScore -= 20;
    alerts.push('No emergency services found in the area');
  }
  
  // Weather-based adjustments
  if (weatherData) {
    const weatherRisk = weatherData.riskAssessment.overallRisk;
    if (weatherRisk > 70) {
      alerts.push('High weather risk detected');
      recommendations.push('Consider postponing outdoor activities');
    } else if (weatherRisk > 40) {
      alerts.push('Moderate weather risk');
      recommendations.push('Monitor weather conditions closely');
    }
    
    // Add weather-specific recommendations
    recommendations.push(...weatherData.riskAssessment.recommendations);
  }
  
  // Activity-specific adjustments
  if (activityType === 'outdoor') {
    environmentalScore -= 10; // Higher risk for outdoor activities
    environmentalFactors.push('Outdoor activity increases exposure to environmental risks');
    recommendations.push('Carry emergency supplies and inform others of your plans');
  } else if (activityType === 'urban') {
    infrastructureScore += 10; // Better infrastructure in urban areas
    environmentalFactors.push('Urban environment with better infrastructure access');
  }
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (infrastructureScore * 0.4) + 
    (weatherScore * 0.4) + 
    (environmentalScore * 0.2)
  );
  
  // Generate general recommendations
  if (overallScore < 60) {
    recommendations.push('Consider traveling with a companion');
    recommendations.push('Keep emergency contacts readily available');
  }
  
  if (hospitalCount === 0) {
    recommendations.push('Locate nearest medical facility before traveling');
  }
  
  if (policeCount === 0) {
    recommendations.push('Be aware of local law enforcement contacts');
  }
  
  recommendations.push('Share your travel itinerary with trusted contacts');
  recommendations.push('Keep your phone charged and carry a power bank');
  
  return {
    overallScore: Math.min(Math.max(overallScore, 0), 100),
    infrastructureScore: Math.min(Math.max(infrastructureScore, 0), 100),
    environmentalScore: Math.min(Math.max(environmentalScore, 0), 100),
    weatherScore: Math.min(Math.max(weatherScore, 0), 100),
    recommendations: [...new Set(recommendations)], // Remove duplicates
    alerts,
    environmentalFactors
  };
}

function generateSafetyRecommendations(score, emergencyServices) {
  const recommendations = [];
  
  if (score < 60) {
    recommendations.push('Consider traveling with a companion');
    recommendations.push('Keep emergency contacts readily available');
  }
  
  if (emergencyServices.filter(s => s.type === 'hospital').length === 0) {
    recommendations.push('Locate nearest medical facility before traveling');
  }
  
  if (emergencyServices.filter(s => s.type === 'police').length === 0) {
    recommendations.push('Be aware of local law enforcement contacts');
  }
  
  recommendations.push('Share your travel itinerary with trusted contacts');
  recommendations.push('Keep your phone charged and carry a power bank');
  
  return recommendations;
}

module.exports = router;
