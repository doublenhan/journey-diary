import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // Set proper content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'POST') {
    // Re-config cloudinary for this request
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    
    // Check credentials
    if (!cloud_name || !api_key || !api_secret) {
      console.error('Missing Cloudinary config for upload');
      return res.status(403).json({ error: 'Cloudinary not configured' });
    }
    
    // Update config
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
    });
    
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          res.status(400).json({ error: 'Form parse error', message: err.message });
          return;
        }
        const { folder = 'love-journal', tags = 'memory', public_id, transformation } = fields;
        if (!files.file) {
          res.status(400).json({ error: 'No file provided' });
          return;
        }
        const uploadOptions = {
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          folder: Array.isArray(folder) ? folder[0] : folder,
          tags: (Array.isArray(tags) ? tags[0] : tags).split(',').map(tag => tag.trim()),
        };
        if (public_id) uploadOptions.public_id = Array.isArray(public_id) ? public_id[0] : public_id;
        if (transformation) {
          try {
            const transformStr = Array.isArray(transformation) ? transformation[0] : transformation;
            const transformObj = JSON.parse(transformStr);
            if (transformObj.width) uploadOptions.width = transformObj.width;
            if (transformObj.height) uploadOptions.height = transformObj.height;
            if (transformObj.crop) uploadOptions.crop = transformObj.crop;
            if (transformObj.quality) uploadOptions.quality = transformObj.quality;
          } catch (e) {
            console.debug('Transform parse error:', e);
          }
        }
        const result = await cloudinary.uploader.upload(files.file.filepath, uploadOptions);
        res.status(200).json({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          created_at: result.created_at,
          tags: result.tags || [],
          folder: result.folder,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image', message: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
