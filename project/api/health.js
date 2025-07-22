export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      cloudinary: process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'mock-mode'
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
