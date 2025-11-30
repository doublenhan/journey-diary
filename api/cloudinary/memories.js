import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId;
      
      // Check if Cloudinary credentials exist
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn('⚠️ Cloudinary credentials not configured');
        return res.status(200).json({ memories: [] });
      }
      
      // Fetch all images with pagination
      let allImages = [];
      let nextCursor = null;
      let pageNum = 0;
      
      do {
        console.log(`[DEBUG] Fetching page ${pageNum}...`);
        
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
        
        console.log(`[DEBUG] Page ${pageNum} returned:`, response.resources.length, 'resources, total_count:', response.total_count);
        
        allImages = allImages.concat(response.resources);
        nextCursor = response.next_cursor;
        pageNum++;
      } while (nextCursor);
      
      console.log(`[DEBUG] Total resources fetched: ${allImages.length}`);
      
      // Group by memory_id and filter by userId if provided
      const memoriesMap = new Map();
      let totalImagesProcessed = 0;
      let imagesWithoutMemoryId = 0;
      let imagesFiltered = 0;
      
      console.log('[DEBUG] Total resources from Cloudinary:', allImages.length);
      
      for (const resource of allImages) {
        // Handle both context.custom and flat context structure
        let customContext = resource.context?.custom || {};
        let flatContext = resource.context || {};
        
        // memory_id can be in either place
        const memoryId = flatContext.memory_id || customContext.memory_id;
        const userId_context = flatContext.userId || customContext.userId;
        
        console.log(`[DEBUG] Processing resource ${resource.public_id}:`, {
          hasMemoryId: !!memoryId,
          memoryId: memoryId || 'N/A',
          userId_context: userId_context || 'N/A',
          userIdFilter: userId || 'N/A',
        });
        
        if (!memoryId) {
          console.log(`[WARN] Image without memory_id: ${resource.public_id}`);
          imagesWithoutMemoryId++;
          continue;
        }
        
        if (userId && userId_context !== userId) {
          console.log(`[DEBUG] Image filtered by userId: ${resource.public_id} (${userId_context} !== ${userId})`);
          imagesFiltered++;
          continue;
        }
        
        totalImagesProcessed++;
        
        if (!memoriesMap.has(memoryId)) {
          memoriesMap.set(memoryId, {
            id: memoryId,
            title: flatContext.title || customContext.title || 'Untitled Memory',
            location: flatContext.location || customContext.location || null,
            text: flatContext.memory_text || customContext.memory_text || '',
            date: flatContext.memory_date || customContext.memory_date || resource.created_at,
            images: [],
            created_at: resource.created_at,
            tags: resource.tags || [],
            folder: resource.folder || 'memories',
          });
        }
        memoriesMap.get(memoryId).images.push({
          public_id: resource.public_id,
          secure_url: resource.secure_url,
          width: resource.width,
          height: resource.height,
          format: resource.format,
          created_at: resource.created_at,
          tags: resource.tags || [],
          folder: resource.folder,
          context: flatContext,
        });
      }
      
      const memories = Array.from(memoriesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      const totalImages = memories.reduce((sum, m) => sum + m.images.length, 0);
      
      console.log('[DEBUG] ✅ Memories processing complete:', {
        totalResources: allImages.length,
        totalImagesProcessed,
        imagesWithoutMemoryId,
        imagesFiltered,
        totalMemories: memories.length,
        totalImages
      });
      
      res.status(200).json({ memories, timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('Memories API error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch memories', 
        message: error.message,
        memories: [] 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
