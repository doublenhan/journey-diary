import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Firebase Admin lazily
let db = null;
let firebaseInitialized = false;

async function getFirestoreDb() {
  if (firebaseInitialized) {
    return db;
  }
  
  try {
    // Check if credentials are available
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
      console.warn('⚠ Firebase Admin credentials not found');
      firebaseInitialized = true;
      return null;
    }
    
    const { initializeApp, getApps, cert } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');
    
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    
    db = getFirestore();
    firebaseInitialized = true;
    console.log('✓ Firebase Admin initialized');
    return db;
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error.message);
    firebaseInitialized = true;
    return null;
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
      console.log(`📊 Created ${memoriesMap.size} memories`);
      
      const memories = Array.from(memoriesMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Fetch metadata from Firestore to get full title, location, text (if Firebase Admin is available)
      if (userId) {
        console.log(`📊 Fetching Firestore data for userId: ${userId}`);
        console.log(`📊 CLOUDINARY_FOLDER_PREFIX: ${process.env.CLOUDINARY_FOLDER_PREFIX}`);
        console.log(`📊 Has FIREBASE_PROJECT_ID: ${!!process.env.FIREBASE_PROJECT_ID}`);
        console.log(`📊 Has FIREBASE_CLIENT_EMAIL: ${!!process.env.FIREBASE_CLIENT_EMAIL}`);
        console.log(`📊 Has FIREBASE_PRIVATE_KEY: ${!!process.env.FIREBASE_PRIVATE_KEY}`);
        
        try {
          const db = await getFirestoreDb();
          if (db) {
            const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
            const collectionName = envPrefix ? `${envPrefix}memories` : 'memories';
            console.log(`📊 Querying Firestore collection: ${collectionName}`);
            
            const memoriesSnapshot = await db.collection(collectionName)
              .where('userId', '==', userId)
              .get();
            
            console.log(`📊 Found ${memoriesSnapshot.size} memories in Firestore`);
            
            const firestoreData = new Map();
            memoriesSnapshot.docs.forEach(doc => {
              const data = doc.data();
              console.log(`📊 Firestore memory: ${doc.id} - ${data.title}`);
              firestoreData.set(doc.id, data);
            });
            
            // Merge Firestore data with Cloudinary data
            memories.forEach(memory => {
              const fsData = firestoreData.get(memory.id);
              if (fsData) {
                console.log(`✓ Merging Firestore data for: ${memory.id}`);
                memory.title = fsData.title || memory.title;
                memory.location = fsData.location || memory.location;
                memory.text = fsData.text || memory.text;
                memory.date = fsData.date || memory.date;
              } else {
                console.log(`⚠ No Firestore data for memory: ${memory.id}`);
              }
            });
            
            console.log(`✓ Merged ${memoriesSnapshot.size} memories from Firestore`);
          } else {
            console.log('⚠ Firebase Admin not initialized, using Cloudinary context only');
          }
        } catch (fsError) {
          console.error('Firestore fetch error:', fsError);
          // Continue with Cloudinary data only
        }
      }
      
      const totalImages = memories.reduce((sum, m) => sum + m.images.length, 0);
      
      // Return debug info in response (temporary for debugging)
      const debugInfo = {
        userId: userId,
        envPrefix: process.env.CLOUDINARY_FOLDER_PREFIX,
        hasFirebaseCredentials: {
          projectId: !!process.env.FIREBASE_PROJECT_ID,
          clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: !!process.env.FIREBASE_PRIVATE_KEY
        },
        cloudinaryStats: {
          totalImages: allImages.length,
          memoriesCreated: memories.length,
          totalProcessed: totalImagesProcessed,
          withoutMemoryId: imagesWithoutMemoryId,
          filtered: imagesFiltered
        }
      };
      
      res.status(200).json({ 
        memories, 
        timestamp: new Date().toISOString(),
        debug: debugInfo
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
