# Geofencing Configuration Guide

This document explains how to configure and manage geofencing for FaceTrack AI.

## Overview

Geofencing restricts attendance marking to authorized campus locations only. When a user attempts to mark attendance, the system verifies their GPS coordinates are within the allowed radius from the campus center point.

## Current Configuration

### Coimbatore Main Campus
- **Location:** Avinashi Rd, Peelamedu, Coimbatore
- **Coordinates:** 11.0126°N, 76.9558°E
- **Allowed Radius:** 200 meters
- **Address:** 22G2+3XV, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004

## Configuration Files

### `src/lib/geofenceConfig.ts`
Central configuration file containing:
- Campus location definitions
- Distance calculation utilities (Haversine formula)
- Geofence verification functions

### `src/pages/AttendanceMarking.tsx`
Implements geofencing verification in the attendance scanning interface:
- Requests user's GPS location
- Calculates distance to campus center
- Prevents scanning outside geofence boundary
- Shows real-time distance feedback

## How to Add a New Campus

1. **Open** `src/lib/geofenceConfig.ts`

2. **Add new location** to `CAMPUS_LOCATIONS` object:
```typescript
export const CAMPUS_LOCATIONS: Record<string, CampusLocation> = {
  coimbatore_main: { /* existing */ },
  
  // NEW CAMPUS
  new_campus: {
    id: 'new_campus',
    name: 'New Campus Name',
    address: 'Complete physical address',
    latitude: 12.3456,      // Get from Google Maps or GPS
    longitude: 76.5432,
    radiusMeters: 200,      // Adjust as needed (in meters)
    description: 'Description of the campus'
  }
};
```

3. **Update** `DEFAULT_CAMPUS` if needed:
```typescript
export const DEFAULT_CAMPUS = CAMPUS_LOCATIONS.new_campus;
```

## Finding GPS Coordinates

### Method 1: Google Maps
1. Go to https://google.com/maps
2. Right-click on the location
3. Click the coordinates to copy

### Method 2: GPS Coordinates website
1. Visit https://www.gps-coordinates.net/
2. Enter the address
3. Copy the latitude and longitude

### Method 3: Manual GPS Device
- Use a GPS device or mobile app to get exact coordinates

## Understanding the Haversine Formula

The system uses the Haversine formula to calculate the great-circle distance between two points on Earth:

```
Distance = 2 × R × arcsin(√(sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)))
```

Where:
- R = Earth's radius (6,371 km = 6,371,000 meters)
- φ = Latitude
- λ = Longitude
- Δ = Difference

This provides accuracy within 0.5% for typical distances.

## Radius Guidelines

Suggested radius values based on campus size:

| Campus Type | Suggested Radius | Notes |
|-------------|------------------|-------|
| Single Building | 50-100 m | Small contained campus |
| Small Campus | 100-200 m | Standard academic building |
| Medium Campus | 200-400 m | Multiple buildings |
| Large Campus | 400-800 m | Sprawling campus |
| Multi-Site | 500-1000 m | Distributed facilities |

## Testing Geofencing Locally

### Without GPS (Development)
- Geofencing will simulate "inside campus" status
- Distance shows as 12m from center
- This allows testing without physical GPS

### With GPS (Production)
- Requires user to grant location permission
- Shows accurate real-time distance
- Prevents attendance if outside radius

## Browser Permissions

Users must grant the following permissions:
- **Camera access** (for face recognition)
- **Location access** (for geofencing verification)

Modern browsers require HTTPS (except localhost) to access these features.

## Security Considerations

1. **GPS Spoofing:** GPS can be spoofed on some devices. Consider pairing with other verification methods.

2. **Location Privacy:** The system only transmits approximate distance to campus, not exact user coordinates.

3. **Fallback Mode:** If geolocation is denied, the system defaults to "inside campus" for mock/testing purposes. Update `checkGeofence()` in `AttendanceMarking.tsx` for production security.

## Troubleshooting

### "Geolocation access denied" message
- User declined location permission
- Browser settings block location access
- Try in incognito mode or different browser
- Ensure HTTPS is used (except localhost)

### Distance shows as incorrect
- GPS signal weak in the area
- Coordinates not set correctly
- Device GPS needs calibration
- Try refreshing the page

### Always inside/outside geofence
- Check coordinates are correct (use Google Maps to verify)
- Verify radius matches campus size
- Ensure device GPS is enabled

## Future Enhancements

- Multi-campus selection UI in Settings
- Polygonal geofence boundaries (instead of circles)
- WiFi-based geofencing as fallback
- Time-based geofence rules (different hours)
- Admin dashboard for geofence management
