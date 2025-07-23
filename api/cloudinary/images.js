
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log('[Cloudinary API] CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('[Cloudinary API] CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);


export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      let { folder, tags, max_results = '20', next_cursor, sort_by = 'created_at', sort_order = 'desc' } = req.query;
      let expression = 'resource_type:image';
      if (folder) expression += ` AND folder:${folder}`;
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
      console.log('[Cloudinary API] Search expression:', expression);
      console.log('[Cloudinary API] Search result:', JSON.stringify(result, null, 2));
      res.status(200).json({ resources: result.resources, next_cursor: result.next_cursor, total_count: result.total_count });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch images', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};
