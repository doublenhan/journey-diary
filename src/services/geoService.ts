/**
 * Geo Service - Direct OpenStreetMap API Integration
 * V3.0: Client-side geocoding without API proxy
 * 
 * Uses:
 * - Nominatim API for search and reverse geocoding (FREE, no API key)
 * - OSRM for routing (FREE, no API key)
 * 
 * Rate Limits:
 * - Nominatim: 1 request/second (enforced by debouncing in components)
 * - OSRM: No strict limits, but be respectful
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_BASE_URL = 'https://router.project-osrm.org';
const USER_AGENT = 'JourneyDiaryApp/3.0';

// Nominatim search result interface
export interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    [key: string]: string | undefined;
  };
}

// Nominatim reverse geocoding result
export interface NominatimReverseResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    road?: string;
    [key: string]: string | undefined;
  };
}

// OSRM route result
export interface OSRMRoute {
  routes: Array<{
    geometry: {
      coordinates: [number, number][]; // [lon, lat]
      type: string;
    };
    distance: number; // in meters
    duration: number; // in seconds
  }>;
}

/**
 * Search for locations by query string
 * @param query - Search query (e.g., "Paris, France")
 * @param limit - Maximum number of results (default: 5)
 * @returns Array of search results
 */
export async function searchLocations(
  query: string,
  limit: number = 5
): Promise<NominatimSearchResult[]> {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', limit.toString());
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.status}`);
    }

    const data: NominatimSearchResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Location search error:', error);
    throw error;
  }
}

/**
 * Reverse geocode coordinates to address
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Location details with address
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<NominatimReverseResult> {
  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': USER_AGENT
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse failed: ${response.status}`);
    }

    const data: NominatimReverseResult = await response.json();
    return data;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

/**
 * Calculate route between multiple coordinates using OSRM
 * @param coordinates - Array of [longitude, latitude] pairs
 * @returns Route geometry and metadata
 */
export async function calculateRoute(
  coordinates: [number, number][]
): Promise<OSRMRoute> {
  if (coordinates.length < 2) {
    throw new Error('At least 2 coordinates are required for routing');
  }

  try {
    // Format: lon,lat;lon,lat;lon,lat
    const coordsString = coordinates
      .map(coord => `${coord[0]},${coord[1]}`)
      .join(';');

    const url = `${OSRM_BASE_URL}/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`OSRM routing failed: ${response.status}`);
    }

    const data: OSRMRoute = await response.json();
    return data;
  } catch (error) {
    console.error('Route calculation error:', error);
    throw error;
  }
}

/**
 * Format coordinates for OSRM routing
 * Helper function to convert lat/lng objects to OSRM format
 */
export function formatCoordinatesForRouting(
  locations: Array<{ latitude: number; longitude: number }>
): [number, number][] {
  return locations.map(loc => [loc.longitude, loc.latitude]);
}

/**
 * Get city name from Nominatim address
 * Helper function to extract the most relevant city/town name
 */
export function getCityFromAddress(address: NominatimReverseResult['address']): string {
  return address.city || address.town || address.village || address.state || address.country || 'Unknown';
}
