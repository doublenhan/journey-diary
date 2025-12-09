/**
 * OSRM Routing Proxy API
 * Bypasses CSP restrictions by proxying OSRM requests through backend
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

  try {
    const { coords } = req.query;
    
    if (!coords) {
      return res.status(400).json({ error: 'Missing coords parameter' });
    }

    // Call OSRM API
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    
    const response = await fetch(osrmUrl);
    
    if (!response.ok) {
      throw new Error(`OSRM API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Return route data
    res.status(200).json(data);
    
  } catch (error) {
    console.error('OSRM routing error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch route',
      message: error.message 
    });
  }
}
