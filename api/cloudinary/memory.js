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
  if (req.method === 'POST') {
    const form = new formidable.IncomingForm({ multiples: true });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(400).json({ error: 'Form parse error', message: err.message });
        return;
      }
      const { title, location, text, date, tags = 'memory', userId } = fields;
      const images = Array.isArray(files.images) ? files.images : files.images ? [files.images] : [];
      if (!title || !text || !date || images.length === 0) {
        res.status(400).json({ error: 'Missing required fields or images' });
        return;
      }
      const folder = `love-journal/memories/${new Date(date).getFullYear()}`;
      const memoryId = `memory-${Date.now()}`;
      const uploadPromises = images.map((file, idx) => {
        return cloudinary.uploader.upload(file.filepath, {
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          folder,
          tags: ['memory', 'love-journal'],
          context: {
            title,
            location: location || '',
            memory_date: date,
            memory_text: text.substring(0, 255),
            memory_id: memoryId,
            custom: { userId: userId || '' },
          },
          public_id: `memory-${Date.now()}-${idx}`,
        });
      });
      try {
        const uploadedImages = await Promise.all(uploadPromises);
        const memory = {
          id: memoryId,
          title,
          location: location || null,
          text,
          date,
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
        res.status(200).json({ success: true, memory, message: 'Memory saved successfully!' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to upload images', message: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
