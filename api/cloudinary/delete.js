import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // Set proper content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'DELETE') {
    try {
      // Re-config cloudinary for this request
      const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
      const api_key = process.env.CLOUDINARY_API_KEY;
      const api_secret = process.env.CLOUDINARY_API_SECRET;
      
      // Check credentials
      if (!cloud_name || !api_key || !api_secret) {
        console.error('Missing Cloudinary config for delete');
        return res.status(403).json({ error: 'Cloudinary not configured' });
      }
      
      // Update config
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
      });
      
      const { public_id } = req.body;
      if (!public_id) {
        res.status(400).json({ error: 'public_id is required' });
        return;
      }
      const result = await cloudinary.uploader.destroy(public_id);
      res.status(200).json({ result: result.result, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
