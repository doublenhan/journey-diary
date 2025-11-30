export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    const config = {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
      allConfigured: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV
    };
    res.status(200).json(config);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
