import { v2 as cloudinary } from 'cloudinary';
import { IncomingForm } from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to generate folder path: users/{userId}/{year}/{month}/memories
function generateFolderPath(userId, dateStr, type = 'memories') {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const month = monthNames[date.getMonth()];
  
  // Structure: love-journal/users/{userId}/{year}/{month}/{type}
  return `love-journal/users/${userId}/${year}/${month}/${type}`;
}

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
      return res.status(403).json({ error: 'Cloudinary not configured' });
    }
    
    cloudinary.config({ cloud_name, api_key, api_secret });
    
    // Parse form data
    let fields, files;
    try {
      const parsed = await parseFormWithTimeout(req);
      fields = parsed.fields;
      files = parsed.files;
    } catch (parseErr) {
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
    const latitudeStr = getFieldValue('latitude');
    const longitudeStr = getFieldValue('longitude');
    
    // Parse coordinates if provided
    const coordinates = {};
    if (latitudeStr && longitudeStr) {
      const lat = parseFloat(latitudeStr);
      const lng = parseFloat(longitudeStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        coordinates.latitude = lat;
        coordinates.longitude = lng;
      }
    }
    
    // Get images array
    let images = files?.images || [];
    if (images && !Array.isArray(images)) {
      images = [images];
    }

    // Validate required fields
    if (!titleStr || !textStr || !dateStr || images.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: { titleStr: !!titleStr, textStr: !!textStr, dateStr: !!dateStr, imageCount: images.length },
        code: 'MISSING_FIELDS'
      });
    }

    // Generate folder path: users/{userId}/{year}/{month}/memories
    const folder = generateFolderPath(userIdStr || 'anonymous', dateStr, 'memories');
    
    // Add environment prefix to folder for DEV/PROD separation
    const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
    const finalFolder = envPrefix ? `${envPrefix}/${folder}` : folder;
    
    const memoryId = `memory-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Upload images with better error handling
    const uploadPromises = images.map((file, idx) => {
      // Create unique public_id with timestamp + random + index
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${idx}`;
      
      // Cloudinary context must be key=value format, not nested objects
      // Use pipe | as delimiter for multiple values
      const contextStr = `memory_id=${memoryId}|memory_date=${dateStr}|title=${titleStr.substring(0, 50)}|location=${(locationStr || '').substring(0, 30)}|memory_text=${textStr.substring(0, 60)}|userId=${userIdStr}`;
      
      return cloudinary.uploader.upload(file.filepath, {
        resource_type: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        folder: finalFolder,
        tags: ['memory', 'love-journal'],
        context: contextStr,
        public_id: `memory-${uniqueSuffix}`,
        timeout: 60000, // 60s timeout per upload
      })
        .catch(uploadErr => {
          throw uploadErr;
        });
    });

    let uploadedImages;
    try {
      uploadedImages = await Promise.all(uploadPromises);
    } catch (uploadErr) {
      return res.status(500).json({
        error: 'Image upload failed',
        message: uploadErr.message,
        code: 'UPLOAD_FAILED'
      });
    }
    
    if (!uploadedImages || uploadedImages.length === 0) {
      return res.status(500).json({
        error: 'No images uploaded',
        message: 'uploadedImages array is empty',
        code: 'NO_IMAGES'
      });
    }

    const memory = {
      id: memoryId,
      title: titleStr,
      location: locationStr || null,
      text: textStr,
      date: dateStr,
      coordinates: Object.keys(coordinates).length > 0 ? coordinates : null,
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

    return res.status(200).json({
      success: true,
      memory,
      message: 'Memory saved successfully!'
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Server error',
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
}
