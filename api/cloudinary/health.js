// api/cloudinary/health.js
export default function handler(req, res) {
  try {
    // Set correct content type header
    res.setHeader('Content-Type', 'application/json');
    
    // Return health status
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'API is healthy'
    });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
}
