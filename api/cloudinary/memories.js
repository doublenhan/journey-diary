import { v2 as cloudinary } from 'cloudinary';

// Try to initialize Firebase Admin, but make it optional
let db = null;
try {
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  
  // Only initialize if credentials are available
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
    db = getFirestore();
    console.log('✓ Firebase Admin initialized');
  } else {
    console.warn('⚠ Firebase Admin credentials not found, will use Cloudinary context only');
  }
} catch (error) {
  console.error('Firebase Admin initialization failed:', error.message);
  db = null;
}

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
        return res.status(200).json({ memories: [] });
      }
      
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
      
      const memories = Array.from(memoriesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Fetch metadata from Firestore to get full title, location, text (if Firebase Admin is available)
      if (userId && db) {
        try {
          const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
          const collectionName = envPrefix ? `${envPrefix}memories` : 'memories';
          const memoriesSnapshot = await db.collection(collectionName)
            .where('userId', '==', userId)
            .get();
          
          const firestoreData = new Map();
          memoriesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            firestoreData.set(doc.id, data);
          });
          
          // Merge Firestore data with Cloudinary data
          memories.forEach(memory => {
            const fsData = firestoreData.get(memory.id);
            if (fsData) {
              memory.title = fsData.title || memory.title;
              memory.location = fsData.location || memory.location;
              memory.text = fsData.text || memory.text;
              memory.date = fsData.date || memory.date;
            }
          });
          
          console.log(`✓ Merged ${memoriesSnapshot.size} memories from Firestore`);
        } catch (fsError) {
          console.error('Firestore fetch error:', fsError);
          // Continue with Cloudinary data only
        }
      }
      
      const totalImages = memories.reduce((sum, m) => sum + m.images.length, 0);
      
      res.status(200).json({ memories, timestamp: new Date().toISOString() });
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
