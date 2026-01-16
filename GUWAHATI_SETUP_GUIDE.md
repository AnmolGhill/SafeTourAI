# Guwahati Restricted Areas Setup Guide

## 📍 Location Configuration

The restricted areas system has been configured for **Guwahati, Assam, India**.

### Coordinates
- **Latitude**: 26.1445°N
- **Longitude**: 91.7362°E
- **Zoom Level**: 13 (city-level view)

---

## 🗺️ Guwahati Map Areas

### Key Locations in Guwahati
1. **Paltan Bazaar** - Commercial hub
   - Coordinates: 26.1426, 91.7368
   - Risk Level: Medium to High

2. **Fancy Bazaar** - Shopping district
   - Coordinates: 26.1445, 91.7362
   - Risk Level: Medium

3. **Kamakhya Temple** - Religious site
   - Coordinates: 26.1903, 91.7289
   - Risk Level: Low to Medium

4. **Guwahati Railway Station** - Transport hub
   - Coordinates: 26.1441, 91.7293
   - Risk Level: Medium

5. **Assam State Museum Area** - Cultural zone
   - Coordinates: 26.1505, 91.7456
   - Risk Level: Low

6. **Uzan Bazaar** - Traditional market
   - Coordinates: 26.1456, 91.7289
   - Risk Level: Medium to High

---

## 🚀 Quick Setup Steps

### Step 1: Verify Guwahati Coordinates
The system is now set to:
- Admin Map: Center at Guwahati (26.1445, 91.7362)
- User Map: Center at Guwahati (26.1445, 91.7362)
- Default Fallback: Guwahati coordinates

### Step 2: Create Sample Restricted Areas

**Example 1: Paltan Bazaar (High Risk)**
1. Go to Admin Dashboard → Restricted Areas
2. Click "Draw Polygon"
3. Draw around Paltan Bazaar area
4. Fill form:
   - Name: "Paltan Bazaar"
   - Description: "High pickpocket activity, crowded area"
   - Risk Level: "High"
5. Save

**Example 2: Kamakhya Temple (Medium Risk)**
1. Click "Draw Circle"
2. Click center at temple location
3. Drag to set radius (~500m)
4. Fill form:
   - Name: "Kamakhya Temple Area"
   - Description: "Crowded during festivals"
   - Risk Level: "Medium"
5. Save

**Example 3: Railway Station (Medium Risk)**
1. Click "Draw Circle"
2. Click at station location
3. Drag radius (~300m)
4. Fill form:
   - Name: "Railway Station"
   - Description: "Busy transport hub"
   - Risk Level: "Medium"
5. Save

---

## 📊 Guwahati-Specific Risk Zones

### High Risk Areas
- **Paltan Bazaar**: Pickpocketing, crowding
- **Fancy Bazaar**: Bag snatching, scams
- **Uzan Bazaar**: Theft, crowding

### Medium Risk Areas
- **Railway Station**: Theft, scams
- **Kamakhya Temple**: Crowding, pickpocketing
- **Bus Stations**: Theft, scams

### Low Risk Areas
- **Assam State Museum**: Generally safe
- **Brahmaputra Riverfront**: Safe during day
- **Residential Areas**: Generally safe

---

## 🎯 Testing in Guwahati

### Test Scenario 1: Paltan Bazaar Alert
1. Create a polygon around Paltan Bazaar
2. Open user map
3. Simulate location near Paltan Bazaar
4. Should receive "Entering Restricted Area" notification

### Test Scenario 2: Temple Area Alert
1. Create a circle around Kamakhya Temple
2. Simulate location inside circle
3. Should receive notification
4. Move outside circle
5. Should receive "Exited" notification

### Test Scenario 3: Real-time Sync
1. Create area in admin map
2. Open user map in another browser
3. Area should appear instantly
4. Delete area in admin
5. Area should disappear in user map

---

## 📱 Mobile Testing in Guwahati

### Enable Location Services
1. Go to Settings → Location
2. Enable "High Accuracy" mode
3. Allow app to access location

### Test with Real Location
1. Open app on mobile device in Guwahati
2. Enable location services
3. Navigate to different areas
4. Verify notifications trigger correctly

---

## 🔍 Guwahati-Specific Features

### Tourist Safety
- Mark popular tourist areas
- Alert visitors of high-risk zones
- Provide safe route suggestions

### Local Safety
- Mark dangerous areas for locals
- Update risk levels based on incidents
- Real-time incident reporting

### Emergency Services
- Mark police stations
- Mark hospitals
- Mark fire stations

---

## 📋 Pre-Deployment Checklist

- [ ] Maps centered on Guwahati (26.1445, 91.7362)
- [ ] Zoom level set to 13
- [ ] Default location is Guwahati
- [ ] Test areas created for major zones
- [ ] Risk levels assigned appropriately
- [ ] Real-time sync tested
- [ ] Mobile location services working
- [ ] Notifications triggering correctly

---

## 🗺️ Guwahati Map Boundaries

**North**: 26.25°N (Narengi area)
**South**: 26.05°N (Silchar direction)
**East**: 91.85°E (Beltola area)
**West**: 91.65°E (Kamakhya area)

---

## 📞 Local Contacts

### Emergency Services
- **Police**: 100 or 0361-2540100
- **Ambulance**: 102 or 0361-2540102
- **Fire**: 101 or 0361-2540101

### Tourist Information
- **Guwahati Tourism**: 0361-2546094
- **Assam Tourism**: 0361-2546094

---

## 🎓 Training Guide

### For Admins
1. Understand Guwahati geography
2. Identify high-risk areas
3. Create appropriate zones
4. Update risk levels regularly
5. Monitor user feedback

### For Users
1. Familiarize with restricted areas
2. Plan routes avoiding high-risk zones
3. Enable location services
4. Pay attention to notifications
5. Report new incidents

---

## 📈 Future Enhancements

- [ ] Integration with Guwahati Police Department
- [ ] Real-time incident reporting
- [ ] Safe route suggestions
- [ ] Emergency service integration
- [ ] Community feedback system
- [ ] Heat map of incidents
- [ ] SMS alerts for high-risk areas
- [ ] Integration with local tourism

---

## 🔐 Data Privacy

- Location data not stored permanently
- Only used for real-time geofencing
- User consent required
- Compliant with Indian privacy laws
- No data sharing with third parties

---

## 📞 Support

For issues specific to Guwahati setup:
1. Check coordinates are correct
2. Verify map is centered on Guwahati
3. Test with sample areas
4. Check browser console for errors
5. Verify Firebase connection

---

**Guwahati Configuration Status**: ✅ COMPLETE

**Coordinates**: 26.1445°N, 91.7362°E  
**Zoom Level**: 13  
**Ready for Testing**: YES ✅

---

**Last Updated**: December 9, 2025
**Version**: 1.0.0
**Location**: Guwahati, Assam, India
