/**
 * Geofencing Configuration
 * Defines campus locations and geofence parameters
 */

export interface CampusLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // Allowed distance from campus center
  description?: string;
}

/**
 * Available campus locations
 * Add more campuses by extending this array
 */
export const CAMPUS_LOCATIONS: Record<string, CampusLocation> = {
  coimbatore_main: {
    id: 'coimbatore_main',
    name: 'Coimbatore Main Campus',
    address: '22G2+3XV, Avinashi Rd, Peelamedu, Coimbatore, Tamil Nadu 641004',
    latitude: 11.0126,
    longitude: 76.9558,
    radiusMeters: 200,
    description: 'Primary campus location in Peelamedu, Coimbatore'
  },
  // Add more campuses as needed
  // example_campus: {
  //   id: 'example_campus',
  //   name: 'Example Campus',
  //   address: 'Example Address',
  //   latitude: 0.0,
  //   longitude: 0.0,
  //   radiusMeters: 200,
  //   description: 'Example campus'
  // }
};

/**
 * Default campus location
 */
export const DEFAULT_CAMPUS = CAMPUS_LOCATIONS.coimbatore_main;

/**
 * Get campus location by ID
 */
export const getCampusLocation = (campusId: string): CampusLocation | null => {
  return CAMPUS_LOCATIONS[campusId] || null;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if user is within campus geofence
 */
export const isWithinGeofence = (
  userLat: number,
  userLon: number,
  campus: CampusLocation
): boolean => {
  const distance = calculateDistance(userLat, userLon, campus.latitude, campus.longitude);
  return distance <= campus.radiusMeters;
};

/**
 * Get geofence status information
 */
export const getGeofenceStatus = (
  userLat: number,
  userLon: number,
  campus: CampusLocation
): {
  inside: boolean;
  distance: number;
  message: string;
} => {
  const distance = calculateDistance(userLat, userLon, campus.latitude, campus.longitude);
  const inside = distance <= campus.radiusMeters;
  const remaining = campus.radiusMeters - distance;

  return {
    inside,
    distance: Math.round(distance),
    message: inside
      ? `✓ Inside campus (${Math.round(distance)}m from center)`
      : `✗ Outside campus boundary (${Math.round(Math.abs(remaining))}m away from limit)`
  };
};
