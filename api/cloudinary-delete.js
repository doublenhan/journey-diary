const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: 'publicId is required' });
    }

    console.log('Deleting image from Cloudinary:', publicId);

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // Invalidate CDN cache
    });

    console.log('Cloudinary delete result:', result);

    if (result.result === 'ok' || result.result === 'not found') {
      return res.status(200).json({ 
        success: true, 
        result: result.result,
        message: result.result === 'not found' ? 'Image already deleted' : 'Image deleted successfully'
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to delete image',
        result: result 
      });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
}
