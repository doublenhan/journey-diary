import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
    const api_key = process.env.CLOUDINARY_API_KEY;
    const api_secret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloud_name || !api_key || !api_secret) {
      return res.status(403).json({ error: 'Cloudinary not configured' });
    }
    
    cloudinary.config({ cloud_name, api_key, api_secret });
    
    // Fetch with pagination
    let allImages = [];
    let nextCursor = null;
    let pageNum = 0;
    
    do {
      const queryParams = {
        type: 'upload',
        resource_type: 'image',
        prefix: 'love-journal/memories/',
        context: true,
        max_results: 100,
      };
      
      if (nextCursor) {
        queryParams.next_cursor = nextCursor;
      }
      
      const response = await cloudinary.api.resources(queryParams);
      allImages = allImages.concat(response.resources);
      nextCursor = response.next_cursor;
      pageNum++;
    } while (nextCursor);
    
    // Analyze each image
    const analysis = allImages.map((r, idx) => {
      const flatCtx = r.context || {};
      const customCtx = r.context?.custom || {};
      const memoryId = flatCtx.memory_id || customCtx.memory_id;
      
      return {
        index: idx,
        public_id: r.public_id,
        created_at: r.created_at,
        folder: r.folder,
        memory_id: memoryId || 'MISSING',
        userId: flatCtx.userId || customCtx.userId || 'MISSING',
        title: flatCtx.title || customCtx.title || 'MISSING',
        context_keys: Object.keys(flatCtx || {}),
        custom_context_keys: Object.keys(customCtx || {}),
      };
    });
    
    res.status(200).json({
      total_fetched: allImages.length,
      analysis,
      summary: {
        total: allImages.length,
        with_memory_id: analysis.filter(a => a.memory_id !== 'MISSING').length,
        without_memory_id: analysis.filter(a => a.memory_id === 'MISSING').length,
        missing_images: analysis.filter(a => a.memory_id === 'MISSING'),
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}
