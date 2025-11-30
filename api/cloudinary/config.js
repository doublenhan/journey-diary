export default function handler(req, res) {
  // Set proper content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    try {
      res.status(200).json({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
        isConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
