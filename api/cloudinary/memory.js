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
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Re-config cloudinary for this request
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloud_name || !api_key || !api_secret) {
      console.error('Missing Cloudinary credentials');
      return res.status(403).json({ error: 'Cloudinary not configured' });
    }
    
    cloudinary.config({ cloud_name, api_key, api_secret });
    
    // Parse form data
    const form = new formidable.IncomingForm({ multiples: true });
    
    return new Promise((resolve) => {
      form.parse(req, async (err, fields, files) => {
        try {
          console.log('[DEBUG] form.parse called, err:', err?.message);
          
          if (err) {
            console.error('[ERROR] Form parse error:', err.message, err.stack);
            res.status(400).json({ error: 'Form parse error', message: err.message, code: 'FORM_PARSE_ERROR' });
            return resolve();
          }

          console.log('[DEBUG] Fields keys:', Object.keys(fields || {}));
          console.log('[DEBUG] Files keys:', Object.keys(files || {}));
          console.log('[DEBUG] Fields:', JSON.stringify(fields, null, 2));
          console.log('[DEBUG] Images count:', Array.isArray(files?.images) ? files.images.length : files?.images ? 1 : 0);

          const { title, location, text, date, userId } = fields || {};
          const titleStr = Array.isArray(title) ? title[0] : title;
          const textStr = Array.isArray(text) ? text[0] : text;
          const dateStr = Array.isArray(date) ? date[0] : date;
          const userIdStr = Array.isArray(userId) ? userId[0] : userId || '';
          const locationStr = Array.isArray(location) ? location[0] : location || '';
          
          const images = Array.isArray(files?.images) ? files.images : files?.images ? [files.images] : [];
          
          console.log('[DEBUG] Extracted fields:', { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length });
          
          if (!titleStr || !textStr || !dateStr || images.length === 0) {
            console.error('[ERROR] Missing required fields:', { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length });
            res.status(400).json({ error: 'Missing required fields', details: { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length }, code: 'MISSING_FIELDS' });
            return resolve();
          }

          const folder = `love-journal/memories/${new Date(dateStr).getFullYear()}`;
          const memoryId = `memory-${Date.now()}`;
          
          console.log('[DEBUG] Starting upload for memoryId:', memoryId);
          console.log('[DEBUG] Images to upload:', images.map((img, i) => ({ idx: i, path: img.filepath, size: img.size })));
          
          // Upload images to Cloudinary
          const uploadPromises = images.map((file, idx) => {
            console.log(`[DEBUG] Uploading image ${idx}:`, file.filepath);
            return cloudinary.uploader.upload(file.filepath, {
              resource_type: 'auto',
              quality: 'auto',
              fetch_format: 'auto',
              folder,
              tags: ['memory', 'love-journal'],
              context: {
                title: titleStr,
                location: locationStr,
                memory_date: dateStr,
                memory_text: textStr.substring(0, 255),
                memory_id: memoryId,
                custom: { userId: userIdStr },
              },
              public_id: `memory-${Date.now()}-${idx}`,
            }).then(result => {
              console.log(`[DEBUG] Upload ${idx} success:`, result.public_id);
              return result;
            }).catch(uploadErr => {
              console.error(`[ERROR] Upload ${idx} failed:`, uploadErr.message, uploadErr);
              throw uploadErr;
            });
          });

          const uploadedImages = await Promise.all(uploadPromises);
          
          console.log('[DEBUG] All uploads complete, saving memory object');
          
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
              folder: img.folder,
            })),
            created_at: new Date().toISOString(),
            tags: ['memory', 'love-journal'],
            folder,
          };

          console.log('[DEBUG] Memory object created, sending response');
          res.status(200).json({ success: true, memory, message: 'Memory saved successfully!' });
          resolve();
        } catch (error) {
          console.error('[ERROR] Inner catch - Memory handler error:', error.message);
          console.error('[ERROR] Stack trace:', error.stack);
          console.error('[ERROR] Full error object:', error);
          res.status(500).json({ 
            error: 'Failed to process request', 
            message: error.message,
            stack: error.stack,
            code: 'HANDLER_ERROR' 
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('[ERROR] Outer catch - Unexpected error:', error.message);
    console.error('[ERROR] Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Server error', 
      message: error.message,
      stack: error.stack,
      code: 'SERVER_ERROR'
    });
  }
}
