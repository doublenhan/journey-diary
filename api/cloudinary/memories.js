import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fetch memories from Firestore using REST API
async function getMemoriesFromFirestore(userId) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const apiKey = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  
  if (!projectId || !apiKey) {
    console.warn('⚠️ Firebase credentials not found, skipping Firestore fetch');
    return [];
  }
  
  try {
    const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
    const collectionName = envPrefix ? `${envPrefix}_memories` : 'memories';
    
    console.log(`📊 Fetching from Firestore collection: ${collectionName} for userId: ${userId}`);
    
    // Firestore REST API endpoint
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}`;
    
    // Query for memories with matching userId
    const response = await fetch(firestoreUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`❌ Firestore API error: ${response.status} ${response.statusText}`);
      return [];
    }
    
    const data = await response.json();
    
    if (!data.documents || data.documents.length === 0) {
      console.log('📭 No documents found in Firestore');
      return [];
    }
    
    // Filter by userId and transform Firestore documents to memory objects
    const memories = data.documents
      .filter(doc => {
        const fields = doc.fields;
        const docUserId = fields?.userId?.stringValue;
        return docUserId === userId;
      })
      .map(doc => {
        const fields = doc.fields;
        const memory = {
          id: fields?.id?.stringValue || doc.name.split('/').pop(),
          title: fields?.title?.stringValue || 'Untitled Memory',
          text: fields?.text?.stringValue || '',
          location: fields?.location?.stringValue || null,
          date: fields?.date?.stringValue || new Date().toISOString(),
          userId: fields?.userId?.stringValue,
        };
        
        // Parse coordinates if available
        if (fields?.coordinates?.mapValue?.fields) {
          const coordFields = fields.coordinates.mapValue.fields;
          memory.coordinates = {
            latitude: coordFields?.latitude?.doubleValue || coordFields?.latitude?.integerValue,
            longitude: coordFields?.longitude?.doubleValue || coordFields?.longitude?.integerValue,
          };
        }
        
        return memory;
      });
    
    console.log(`✅ Found ${memories.length} memories in Firestore for userId: ${userId}`);
    return memories;
    
  } catch (error) {
    console.error('❌ Error fetching from Firestore:', error.message);
    return [];
  }
}

export default async function handler(req, res) {
  // Set correct content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'GET') {
    try {
      const userId = req.query.userId;
      
      console.log(`🔍 API called with userId: ${userId}`);
      console.log(`🔍 Full query:`, req.query);
      
      // Check if Cloudinary credentials exist
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error('❌ Cloudinary credentials missing');
        return res.status(200).json({ memories: [] });
      }
      
      console.log(`✓ Cloudinary configured: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      
      // Fetch all images with pagination
      let allImages = [];
      let nextCursor = null;
      let pageNum = 0;
      
      // Add environment prefix to folder for DEV/PROD separation
      const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
      
      // New structure: users/{userId}/{year}/{month}/memories/
      // Old structure: love-journal/memories/ (fallback for backwards compatibility)
      let finalPrefix;
      
      if (userId) {
        // Search in new user-based structure
        const basePrefix = `love-journal/users/${userId}`;
        finalPrefix = envPrefix ? `${envPrefix}/${basePrefix}` : basePrefix;
      } else {
        // Fallback to old structure if no userId provided
        const basePrefix = 'love-journal/memories/';
        finalPrefix = envPrefix ? `${envPrefix}/${basePrefix}` : basePrefix;
      }
      
      console.log(`🔍 Searching Cloudinary with prefix: ${finalPrefix}`);
      
      do {
        const queryParams = {
          type: 'upload',
          resource_type: 'image',
          prefix: finalPrefix,
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
      
      console.log(`🔍 Found ${allImages.length} total images in Cloudinary`);
      
      // Group by memory_id and filter by userId if provided
      const memoriesMap = new Map();
      let totalImagesProcessed = 0;
      let imagesWithoutMemoryId = 0;
      let imagesFiltered = 0;
      
      for (const resource of allImages) {
        // Parse context - can be string (pipe-delimited) or object
        let contextData = {};
        if (typeof resource.context === 'string') {
          // Parse pipe-delimited format: key1=val1|key2=val2|...
          resource.context.split('|').forEach(pair => {
            const [key, value] = pair.split('=');
            if (key && value) contextData[key.trim()] = value.trim();
          });
        } else if (typeof resource.context === 'object') {
          // Handle nested custom or flat structure
          contextData = resource.context.custom || resource.context || {};
        }
        
        const memoryId = contextData.memory_id;
        const userId_context = contextData.userId;
        
        if (!memoryId) {
          imagesWithoutMemoryId++;
          continue;
        }
        
        if (userId && userId_context !== userId) {
          imagesFiltered++;
          continue;
        }
        
        totalImagesProcessed++;
        
        if (!memoriesMap.has(memoryId)) {
          memoriesMap.set(memoryId, {
            id: memoryId,
            title: contextData.title || 'Untitled Memory',
            location: contextData.location || null,
            text: contextData.memory_text || '',
            date: contextData.memory_date || resource.created_at,
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
          context: contextData,
        });
      }
      
      console.log(`📊 Cloudinary stats: ${allImages.length} images, ${totalImagesProcessed} processed, ${imagesWithoutMemoryId} without memory_id, ${imagesFiltered} filtered`);
      console.log(`📊 Created ${memoriesMap.size} memories from Cloudinary`);
      
      const memories = Array.from(memoriesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Fetch full metadata from Firestore using REST API
      if (userId) {
        console.log(`🔥 Fetching full metadata from Firestore for userId: ${userId}`);
        
        try {
          const firestoreMemories = await getMemoriesFromFirestore(userId);
          
          if (firestoreMemories.length > 0) {
            // Create a map for quick lookup
            const firestoreMap = new Map();
            firestoreMemories.forEach(fm => {
              firestoreMap.set(fm.id, fm);
            });
            
            // Merge Firestore metadata with Cloudinary images
            memories.forEach(memory => {
              const fsData = firestoreMap.get(memory.id);
              if (fsData) {
                console.log(`✅ Merging Firestore data for memory: ${memory.id}`);
                memory.title = fsData.title;
                memory.text = fsData.text;
                memory.location = fsData.location;
                memory.date = fsData.date;
                memory.coordinates = fsData.coordinates;
              } else {
                console.log(`⚠️ No Firestore data found for memory: ${memory.id}`);
              }
            });
            
            console.log(`✅ Successfully merged ${firestoreMemories.length} memories from Firestore`);
          } else {
            console.log('📭 No memories found in Firestore, using Cloudinary context only');
          }
        } catch (fsError) {
          console.error('❌ Firestore fetch error:', fsError.message);
          // Continue with Cloudinary data only
        }
      }
      
      const totalImages = memories.reduce((sum, m) => sum + m.images.length, 0);
      
      console.log(`📤 Returning ${memories.length} memories with ${totalImages} total images`);
      
      res.status(200).json({ 
        memories, 
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
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
