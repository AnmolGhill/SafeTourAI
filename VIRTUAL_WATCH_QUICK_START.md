# Virtual SmartWatch Simulator - Quick Start Guide

## What Was Added?

A new **Virtual SmartWatch Simulator** page in the user dashboard that allows you to:
- View a realistic smartwatch display
- Simulate abnormal heart rate conditions
- Test emergency alert scenarios
- Monitor virtual health metrics

## How to Access

1. Log in to SafeTourAI user dashboard
2. Look for **"Virtual Watch"** in the left sidebar menu
3. Click it to open the simulator

## How to Use

### Basic Operation

**Increase Heart Rate (Simulate Abnormal Condition):**
- Hold down the red **"Increase Heart Rate"** button
- Heart rate will gradually increase (2 BPM every 200ms)
- Maximum reaches 150 BPM
- Release the button to stop increasing

**Normalize Heart Rate (Return to Normal):**
- Click the green **"Normalize"** button
- Heart rate gradually decreases back to 72 BPM
- Takes about 30-40 seconds to fully normalize

**Auto-Normalize:**
- If you stop clicking the increase button
- System automatically normalizes after 30 seconds
- No manual action needed

**Reset Everything:**
- Click **"Reset Simulation"** button
- All data returns to initial state
- Heart rate: 72 BPM
- Steps: 8,547
- Battery: 85%

## Watch Display

The circular watch face shows:
- **Top**: Digital time (HH:MM)
- **Center**: Heart rate in BPM with ❤ icon
- **Bottom**: Steps and date
- **Top Right**: Battery percentage
- **Status Dot**: Green (normal) or Red (abnormal)

## Health Metrics

The page displays:
- **Heart Rate**: Current BPM and status
- **Steps**: Daily step count
- **Calories**: Burned calories
- **Distance**: Distance traveled
- **Sleep**: Hours slept
- **Temperature**: Body temperature
- **Stress Level**: Low/Medium/High
- **Battery**: Watch battery percentage

## Heart Rate Ranges

| Range | Status | Color |
|-------|--------|-------|
| 60-100 BPM | Normal | Green |
| 100-120 BPM | Elevated | Yellow |
| 120+ BPM | High | Red |

## Status Indicators

- **Green indicator**: Normal heart rate, all good
- **Red indicator**: Abnormal heart rate detected, warning active
- **Abnormal Mode banner**: Shows duration of abnormal state

## Tips

1. **Testing Emergency Alerts**: Use the increase button to simulate high heart rate conditions
2. **Smooth Transitions**: Heart rate changes gradually, not instantly
3. **Mobile Friendly**: Works on phones and tablets with touch support
4. **No Real Device Needed**: Completely virtual, no Bluetooth required
5. **Session Data**: All data resets when you navigate away or refresh

## Features

✅ Realistic smartwatch UI
✅ Interactive heart rate controls
✅ Real-time clock display
✅ Multiple health metrics
✅ Abnormal state detection
✅ Auto-normalization
✅ Responsive design
✅ Touch-friendly buttons
✅ Color-coded status indicators
✅ Detailed health information

## Troubleshooting

**Watch not displaying?**
- Refresh the page
- Check browser console for errors
- Ensure JavaScript is enabled

**Buttons not responding?**
- Try clicking/touching again
- Check if browser supports touch events
- Clear browser cache if needed

**Data not updating?**
- Ensure you're on the Virtual Watch page
- Try resetting the simulation
- Refresh the page

## Next Steps

- Explore different heart rate levels
- Test the auto-normalize feature
- Check how stress level changes with heart rate
- Try on different devices/screen sizes
- Use for testing emergency alert systems

## Files Modified/Created

**New File:**
- `VirtualSmartWatchSimulator.jsx` - Main component

**Modified Files:**
- `UserDashboard.jsx` - Added import and case handler
- `Sidebar.jsx` - Added menu item

## Support

For issues or questions, refer to the full implementation guide:
`VIRTUAL_SMARTWATCH_IMPLEMENTATION.md`
