/**
 * Unified Geocoding & Routing API
 * Handles: location search, reverse geocoding, and route calculation
 * This consolidates multiple endpoints to stay within Vercel's 12 function limit
 */
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, q, lat, lon, coords } = req.query;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(q, res);
      
      case 'reverse':
        return await handleReverse(lat, lon, res);
      
      case 'route':
        return await handleRoute(coords, res);
      
      default:
        return res.status(400).json({ 
          error: 'Invalid action. Use: search, reverse, or route' 
        });
    }
  } catch (error) {
    console.error('Geocoding API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Search for locations by query string
async function handleSearch(query, res) {
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?` +
    `format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LoveJournalApp/1.0'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`);
  }

  const data = await response.json();
  return res.status(200).json(data);
}

// Reverse geocode coordinates to address
async function handleReverse(lat, lon, res) {
  if (!lat || !lon) {
    return res.status(400).json({ 
      error: 'Both "lat" and "lon" parameters are required' 
    });
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?` +
    `format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
    {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'LoveJournalApp/1.0'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim reverse failed: ${response.status}`);
  }

  const data = await response.json();
  return res.status(200).json(data);
}

// Calculate route between coordinates
async function handleRoute(coords, res) {
  if (!coords) {
    return res.status(400).json({ error: 'Parameter "coords" is required' });
  }

  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  
  const response = await fetch(osrmUrl);
  
  if (!response.ok) {
    throw new Error(`OSRM routing failed: ${response.status}`);
  }
  
  const data = await response.json();
  return res.status(200).json(data);
}
