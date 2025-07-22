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
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
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
        folder,
        tags: tags.split(',').map(tag => tag.trim()),
      };
      if (public_id) uploadOptions.public_id = public_id;
      if (transformation) {
        try {
          const transformObj = JSON.parse(transformation);
          if (transformObj.width) uploadOptions.width = transformObj.width;
          if (transformObj.height) uploadOptions.height = transformObj.height;
          if (transformObj.crop) uploadOptions.crop = transformObj.crop;
          if (transformObj.quality) uploadOptions.quality = transformObj.quality;
        } catch (e) {}
      }
      try {
        const result = await cloudinary.uploader.upload(files.file.filepath, uploadOptions);
        res.status(200).json({
          public_id: result.public_id,
          secure_url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          created_at: result.created_at,
          tags: result.tags || [],
          folder: result.folder
        });
      } catch (error) {
        res.status(500).json({ error: 'Failed to upload image', message: error.message });
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
