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
    // Re-config cloudinary for this request (environment may not be set initially)
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    
    // Check credentials
    if (!cloud_name || !api_key || !api_secret) {
      console.error('Missing Cloudinary config:', {
        cloud_name: !!cloud_name,
        api_key: !!api_key,
        api_secret: !!api_secret
      });
      return res.status(403).json({ error: 'Cloudinary not configured', code: 'MISSING_CONFIG' });
    }
    
    // Update config
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
    });
    
    const form = new formidable.IncomingForm({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          console.error('Form parse error:', err);
          res.status(400).json({ error: 'Form parse error', message: err.message });
          return;
        }
        const { title, location, text, date, tags = 'memory', userId } = fields;
        const titleStr = Array.isArray(title) ? title[0] : title;
        const textStr = Array.isArray(text) ? text[0] : text;
        const dateStr = Array.isArray(date) ? date[0] : date;
        const userIdStr = Array.isArray(userId) ? userId[0] : userId;
        const locationStr = Array.isArray(location) ? location[0] : location;
        
        const images = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];
        if (!titleStr || !textStr || !dateStr || images.length === 0) {
          console.warn('Missing fields:', { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, images: images.length });
          res.status(400).json({ error: 'Missing required fields: title, text, date, or images' });
          return;
        }
        const folder = `love-journal/memories/${new Date(dateStr).getFullYear()}`;
        const memoryId = `memory-${Date.now()}`;
        const uploadPromises = images.map((file, idx) => {
          return cloudinary.uploader.upload(file.filepath, {
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
            folder,
            tags: ['memory', 'love-journal'],
            context: {
              title: titleStr,
              location: locationStr || '',
              memory_date: dateStr,
              memory_text: textStr.substring(0, 255),
              memory_id: memoryId,
              custom: { userId: userIdStr || '' },
            },
            public_id: `memory-${Date.now()}-${idx}`,
          });
        });
        const uploadedImages = await Promise.all(uploadPromises);
        const memory = {
          id: memoryId,
          title: titleStr,
          location: locationStr || null,
          text: textStr,
          date: dateStr,
          images: uploadedImages.map(img => ({
            public_id: img.public_id,
            secure_url: img.secure_url,
            width: img.width,
            height: img.height,
            format: img.format,
            created_at: img.created_at,
            tags: img.tags || [],
            context: img.context?.custom || {},
            folder: img.folder,
          })),
          created_at: new Date().toISOString(),
          tags: ['memory', 'love-journal'],
          folder,
        };
        res.status(200).json({ success: true, memory, message: 'Memory saved successfully!', timestamp: new Date().toISOString() });
      } catch (error) {
        console.error('Memory save error:', error);
        res.status(500).json({ error: 'Failed to upload images', message: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
