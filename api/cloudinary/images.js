import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // Set proper content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    try {
      // Check credentials
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn('⚠️ Cloudinary credentials not configured');
        return res.status(200).json({ resources: [], next_cursor: null, total_count: 0 });
      }
      
      let { folder, tags, max_results = '20', next_cursor, sort_by = 'created_at', sort_order = 'desc', userId } = req.query;
      
      // Add environment prefix to folder for DEV/PROD separation
      const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
      
      // If userId provided, search in users/{userId}/** structure
      let finalFolder = folder;
      if (userId && !folder) {
        // Search all folders under this user
        finalFolder = `love-journal/users/${userId}`;
      } else if (folder) {
        // Use provided folder
        finalFolder = folder;
      }
      
      // Apply environment prefix
      if (finalFolder && envPrefix) {
        finalFolder = `${envPrefix}/${finalFolder}`;
      }
      
      let expression = 'resource_type:image';
      if (finalFolder) {
        // Use wildcard to search in folder and subfolders
        expression += ` AND folder:${finalFolder}/*`;
      }
      if (tags) {
        const tagArray = tags.split(',');
        const tagExpression = tagArray.map(tag => `tags:${tag.trim()}`).join(' AND ');
        expression += ` AND (${tagExpression})`;
      }
      const sortOrder = (sort_order === 'asc' || sort_order === 'desc') ? sort_order : 'desc';
      const result = await cloudinary.search
        .expression(expression)
        .sort_by(sort_by, sortOrder)
        .max_results(parseInt(max_results))
        .next_cursor(next_cursor)
        .with_field('tags')
        .with_field('context')
        .with_field('metadata')
        .execute();
      res.status(200).json({ resources: result.resources, next_cursor: result.next_cursor, total_count: result.total_count });
    } catch (error) {
      console.error('Images API error:', error);
      res.status(500).json({ error: 'Failed to fetch images', message: error.message, resources: [] });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
