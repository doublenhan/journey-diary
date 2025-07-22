import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    try {
      const { public_id } = req.body;
      if (!public_id) {
        res.status(400).json({ error: 'public_id is required' });
        return;
      }
      const result = await cloudinary.uploader.destroy(public_id);
      res.status(200).json({ result: result.result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete image', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
