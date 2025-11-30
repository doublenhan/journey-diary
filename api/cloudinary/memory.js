import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse form with timeout
async function parseFormWithTimeout(req, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const timeout = setTimeout(() => {
      reject(new Error('Form parsing timeout'));
    }, timeoutMs);

    form.parse(req, (err, fields, files) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Re-config cloudinary per request
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloud_name || !api_key || !api_secret) {
      console.error('[ERROR] Missing Cloudinary config');
      return res.status(403).json({ error: 'Cloudinary not configured' });
    }
    
    cloudinary.config({ cloud_name, api_key, api_secret });
    
    // Parse form data
    console.log('[DEBUG] Starting form parse...');
    let fields, files;
    try {
      const parsed = await parseFormWithTimeout(req);
      fields = parsed.fields;
      files = parsed.files;
    } catch (parseErr) {
      console.error('[ERROR] Form parse failed:', parseErr.message);
      return res.status(400).json({ 
        error: 'Form parse error',
        message: parseErr.message,
        code: 'FORM_PARSE_FAILED'
      });
    }

    // Extract field values (formidable v3 returns values as arrays)
    const getFieldValue = (fieldName) => {
      const field = fields?.[fieldName];
      if (!field) return undefined;
      return Array.isArray(field) ? field[0] : field;
    };

    const titleStr = getFieldValue('title');
    const textStr = getFieldValue('text');
    const dateStr = getFieldValue('date');
    const userIdStr = getFieldValue('userId') || '';
    const locationStr = getFieldValue('location') || '';
    
    // Get images array
    let images = files?.images || [];
    if (images && !Array.isArray(images)) {
      images = [images];
    }

    console.log('[DEBUG] Fields extracted:', { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length });
    
    // Validate required fields
    if (!titleStr || !textStr || !dateStr || images.length === 0) {
      console.error('[ERROR] Missing required fields:', {
        titleStr: !!titleStr,
        textStr: !!textStr,
        dateStr: !!dateStr,
        imageCount: images.length
      });
      return res.status(400).json({
        error: 'Missing required fields',
        details: { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length },
        code: 'MISSING_FIELDS'
      });
    }

    const folder = `love-journal/memories/${new Date(dateStr).getFullYear()}`;
    const memoryId = `memory-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log('[DEBUG] Starting image uploads...');
    console.log('[DEBUG] Uploading', images.length, 'images to folder:', folder);
    console.log('[DEBUG] Memory ID:', memoryId);

    // Upload images with better error handling
    const uploadPromises = images.map((file, idx) => {
      console.log(`[DEBUG] Image ${idx}: ${file.filepath} (${file.size} bytes)`);
      
      // Create unique public_id with timestamp + random + index
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}`;
      
      const contextObj = {
        custom: {
          memory_id: memoryId,
          memory_date: dateStr,
          title: titleStr,
          location: locationStr || '',
          memory_text: textStr.substring(0, 100),  // Reduced from 255
          userId: userIdStr,
        }
      };
      
      console.log(`[DEBUG] Image ${idx} context object created:`, {
        memoryId,
        hasUserId: !!userIdStr,
        hasTitle: !!titleStr,
        hasDate: !!dateStr
      });
      
      return cloudinary.uploader.upload(file.filepath, {
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        folder,
        tags: ['memory', 'love-journal'],
        context: contextObj,
        public_id: `memory-${uniqueSuffix}`,
        timeout: 60000, // 60s timeout per upload
      })
        .then(result => {
          console.log(`[DEBUG] Image ${idx} uploaded: ${result.public_id}`);
          return result;
        })
        .catch(uploadErr => {
          console.error(`[ERROR] Image ${idx} upload failed:`, uploadErr.message);
          throw uploadErr;
        });
    });

    let uploadedImages;
    try {
      console.log(`[DEBUG] Uploading ${uploadPromises.length} images with Promise.all...`);
      uploadedImages = await Promise.all(uploadPromises);
      console.log(`[DEBUG] Promise.all resolved: ${uploadedImages.length} images uploaded`);
    } catch (uploadErr) {
      console.error('[ERROR] Image upload failed:', uploadErr.message);
      console.error('[ERROR] Stack:', uploadErr.stack);
      return res.status(500).json({
        error: 'Image upload failed',
        message: uploadErr.message,
        code: 'UPLOAD_FAILED'
      });
    }
    
    if (!uploadedImages || uploadedImages.length === 0) {
      console.error('[ERROR] uploadedImages is empty after Promise.all');
      return res.status(500).json({
        error: 'No images uploaded',
        message: 'uploadedImages array is empty',
        code: 'NO_IMAGES'
      });
    }

    console.log(`[DEBUG] All images uploaded successfully: ${uploadedImages.length} images`);
    console.log('[DEBUG] uploadedImages details:', uploadedImages.map((img, i) => ({ 
      idx: i, 
      public_id: img.public_id,
      secure_url: img.secure_url?.substring(0, 50) + '...'
    })));
    console.log('[DEBUG] Creating memory object...');

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

    console.log('[DEBUG] Memory saved successfully, returning response');
    return res.status(200).json({
      success: true,
      memory,
      message: 'Memory saved successfully!'
    });

  } catch (error) {
    console.error('[ERROR] Outer catch:', error.message);
    console.error('[ERROR] Stack:', error.stack);
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
}
