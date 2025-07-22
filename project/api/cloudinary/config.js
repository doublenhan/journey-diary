export default function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
      isConfigured: Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
