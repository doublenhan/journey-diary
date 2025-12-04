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
    
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });
    
    form.parse(req, async (err, fields, files) => {
      try {
        if (err) {
          console.error('Form parse error:', err);
          res.status(400).json({ error: 'Form parse error', message: err.message });
          return;
        }
        
        console.log('Received fields:', fields);
        console.log('Received files:', files);
        
        // Extract folder from fields (formidable v3 returns arrays)
        const folderValue = Array.isArray(fields.folder) ? fields.folder[0] : fields.folder;
        const folder = folderValue || 'love-journal';
        const tagsValue = Array.isArray(fields.tags) ? fields.tags[0] : fields.tags;
        const tags = tagsValue || 'memory';
        const publicIdValue = Array.isArray(fields.public_id) ? fields.public_id[0] : fields.public_id;
        const public_id = publicIdValue;
        const transformationValue = Array.isArray(fields.transformation) ? fields.transformation[0] : fields.transformation;
        const transformation = transformationValue;
        const contextValue = Array.isArray(fields.context) ? fields.context[0] : fields.context;
        const context = contextValue;
        
        // Add environment prefix to folder
        const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
        const finalFolder = envPrefix ? `${envPrefix}/${folder}` : folder;
        
        if (!files.file) {
          console.error('No file in request');
          res.status(400).json({ error: 'No file provided' });
          return;
        }
        
        // Handle formidable v3 - files.file is an array
        const fileToUpload = Array.isArray(files.file) ? files.file[0] : files.file;
        if (!fileToUpload) {
          console.error('File array empty');
          res.status(400).json({ error: 'No file in array' });
          return;
        }
        
        const filePath = fileToUpload.filepath || fileToUpload.path;
        
        if (!filePath) {
          console.error('No filepath in file object:', fileToUpload);
          res.status(400).json({ error: 'Invalid file path' });
          return;
        }
        
        console.log('Uploading file:', filePath, 'to folder:', finalFolder);
        
        const uploadOptions = {
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          folder: finalFolder,
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
          } catch (e) {
            console.debug('Transform parse error:', e);
          }
        }
        
        // Add context metadata for grouping
        if (context) {
          try {
            const contextObj = JSON.parse(context);
            uploadOptions.context = contextObj;
            console.log('Adding context:', contextObj);
          } catch (e) {
            console.debug('Context parse error:', e);
          }
        }
        
        console.log('Upload options:', uploadOptions);
        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        console.log('Upload successful:', result.public_id);
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
