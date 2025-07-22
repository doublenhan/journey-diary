import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId;
      const allImages = await cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: 'love-journal/memories/',
        context: true,
        max_results: 100,
      });
      // Group by memory_id and filter by userId if provided
      const memoriesMap = new Map();
      for (const resource of allImages.resources) {
        let context = resource.context?.custom || resource.context || {};
        if (context.memory_id) {
          if (!userId || context.userId === userId || context.custom?.userId === userId) {
            if (!memoriesMap.has(context.memory_id)) {
              memoriesMap.set(context.memory_id, {
                id: context.memory_id,
                title: context.title || 'Untitled Memory',
                location: context.location || null,
                text: context.memory_text || '',
                date: context.memory_date || resource.created_at,
                images: [],
                created_at: resource.created_at,
                tags: resource.tags || [],
                folder: resource.folder || 'memories',
              });
            }
            memoriesMap.get(context.memory_id).images.push({
              public_id: resource.public_id,
              secure_url: resource.secure_url,
              width: resource.width,
              height: resource.height,
              format: resource.format,
              created_at: resource.created_at,
              tags: resource.tags || [],
              folder: resource.folder,
              context,
            });
          }
        }
      }
      const memories = Array.from(memoriesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      res.status(200).json({ memories });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch memories', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
