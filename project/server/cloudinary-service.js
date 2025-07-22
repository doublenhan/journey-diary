// Simple in-memory cache for getCloudinaryMemories (per userId)
const memoriesCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configure Cloudinary
const configureCloudinary = () => {
  const config = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
  };

  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.warn('⚠️  Cloudinary not fully configured. Some features will use mock data.');
    console.log('📝 Make sure to set: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    return false;
  }

  cloudinary.config(config);
  console.log('✅ Cloudinary configured successfully');
  return true;
};

/**
 * Groups images by memory_id from context
 * @param {Array} resources - Cloudinary resources
 * @returns {Array} - Grouped memories
 */
const groupByMemoryId = (resources) => {
  if (!resources || !Array.isArray(resources) || resources.length === 0) {
    return [];
  }

  // Process resources to group them by memory_id
  const memoriesMap = new Map();
  
  for (const resource of resources) {
    // Always extract context.custom if available
    let context = {};
    if (resource.context && resource.context.custom) {
      context = resource.context.custom;
    }
    // Fallback: if context.custom not available, try context directly (legacy)
    else if (resource.context) {
      context = resource.context;
    }
    if (context.memory_id) {
      const memoryId = context.memory_id;
      if (!memoriesMap.has(memoryId)) {
        memoriesMap.set(memoryId, {
          id: memoryId,
          title: context.title || 'Untitled Memory',
          location: context.location || null,
          text: context.memory_text || '',
          date: context.memory_date || resource.created_at,
          images: [],
          created_at: resource.created_at,
          tags: resource.tags || [],
          folder: resource.folder || 'memories'
        });
      }
      // Add this image to the memory, always attach context for filtering
      memoriesMap.get(memoryId).images.push({
        public_id: resource.public_id,
        secure_url: resource.secure_url,
        width: resource.width,
        height: resource.height,
        format: resource.format,
        created_at: resource.created_at,
        tags: resource.tags || [],
        folder: resource.folder,
        context: context // always attach context for userId filtering
      });
    }
  }
  
  // Convert map to array and sort by date (newest first)
  return Array.from(memoriesMap.values()).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * Get memories from Cloudinary by retrieving all resources in the memories folder
 * and grouping them by memory_id
 */
const getCloudinaryMemories = async () => {
  const allImages = await cloudinary.api.resources({
    type: 'upload',
    resource_type: 'image',
    prefix: 'love-journal/memories/',
    context: true,
    max_results: 100,
  });

  return groupByMemoryId(allImages.resources);
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  }
});

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Cloudinary
const isCloudinaryConfigured = configureCloudinary();

// Routes

/**
 * GET /api/cloudinary/images
 * Fetch images from Cloudinary
 */
app.get('/api/cloudinary/images', async (req, res) => {
  try {
    const { 
      folder, 
      tags, 
      max_results = '20', 
      next_cursor,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    if (!isCloudinaryConfigured) {
      console.log('⚠️ Cloudinary not configured! Please set up environment variables.');
      return res.status(503).json({ 
        error: 'Cloudinary service not configured',
        message: 'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
      });
    }

    // Build search expression
    let expression = 'resource_type:image';
    
    if (folder) {
      expression += ` AND folder:${folder}`;
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      const tagExpression = tagArray.map(tag => `tags:${tag.trim()}`).join(' AND ');
      expression += ` AND (${tagExpression})`;
    }

    // Execute search using Cloudinary SDK
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

    res.json({
      resources: result.resources,
      next_cursor: result.next_cursor,
      total_count: result.total_count,
    });
  } catch (error) {
    console.error('❌ Error fetching images:', error);
    res.status(500).json({ 
      error: 'Failed to fetch images',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * POST /api/cloudinary/upload
 * Upload image to Cloudinary
 */
app.post('/api/cloudinary/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folder = 'love-journal', tags = 'memory', public_id, transformation } = req.body;

    if (!isCloudinaryConfigured) {
      console.log('⚠️ Cloudinary not configured! Please set up environment variables.');
      return res.status(503).json({ 
        error: 'Cloudinary service not configured',
        message: 'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
      });
    }

    const uploadOptions = {
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      folder: folder || 'love-journal',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : ['memory']
    };

    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    if (transformation) {
      try {
        const transformObj = JSON.parse(transformation);
        if (transformObj.width) uploadOptions.width = transformObj.width;
        if (transformObj.height) uploadOptions.height = transformObj.height;
        if (transformObj.crop) uploadOptions.crop = transformObj.crop;
        if (transformObj.quality) uploadOptions.quality = transformObj.quality;
      } catch (e) {
        console.warn('⚠️  Invalid transformation JSON:', transformation);
      }
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    res.json({
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      created_at: result.created_at,
      tags: result.tags || [],
      folder: result.folder
    });
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * DELETE /api/cloudinary/delete
 * Delete image from Cloudinary
 */
app.delete('/api/cloudinary/delete', async (req, res) => {
  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: 'public_id is required' });
    }

    if (!isCloudinaryConfigured) {
      console.log('⚠️ Cloudinary not configured! Please set up environment variables.');
      return res.status(503).json({ 
        error: 'Cloudinary service not configured',
        message: 'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);
    res.json({ result: result.result });
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({ 
      error: 'Failed to delete image',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/cloudinary/config
 * Get public Cloudinary configuration for client
 */
app.get('/api/cloudinary/config', (req, res) => {
  res.json({
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
    isConfigured: isCloudinaryConfigured
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cloudinary: isCloudinaryConfigured ? 'configured' : 'mock-mode'
  });
});

/**
 * POST /api/cloudinary/memory
 * Save a complete memory with text data and multiple images
 */
app.post('/api/cloudinary/memory', upload.array('images', 10), async (req, res) => {
  try {
    const { title, location, text, date, tags = 'memory', userId } = req.body;
    
    // Validate required fields
    if (!title || !text || !date || !location) {
      return res.status(400).json({ 
        error: 'All fields (title, location, text, date) are required' 
      });
    }
    
    // Validate that images are provided
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'At least one image is required'
      });
    }

    const folder = `love-journal/memories/${new Date(date || Date.now()).getFullYear()}`;
    const memoryTags = tags.split(',').map(tag => tag.trim());
    memoryTags.push('memory', 'love-journal');
    
    // Add date and location tags if provided
    if (date) {
      const dateObj = new Date(date);
      memoryTags.push(`date-${dateObj.getFullYear()}-${dateObj.getMonth() + 1}`);
    }
    if (location) {
      memoryTags.push(`location-${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }

    let uploadedImages = [];

    // Upload images if provided
    if (req.files && req.files.length > 0) {
      if (!isCloudinaryConfigured) {
        console.log('🔄 Using mock data for memory with images');
        uploadedImages = [];
      } else {
        // Upload images to Cloudinary
        const memoryId = `memory-${Date.now()}`;
        const uploadPromises = req.files.map(async (file, index) => {
        const uploadOptions = {
          resource_type: 'auto',
          quality: 'auto',
          fetch_format: 'auto',
          folder,
          tags: ['memory', 'love-journal'], // Keep only basic tags
          context: {
            title: title,
            location: location || '',
            memory_date: date,
            memory_text: text.substring(0, 255), // First 255 chars only for context
            memory_id: memoryId,
            // Always save userId in custom.userId for Cloudinary compatibility
            custom: {
              userId: userId || ''
            }
          },
          public_id: `memory-${Date.now()}-${index}`
        };

          return new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              uploadOptions,
              (error, result) => {
                if (error) reject(error);
                else resolve({
                  public_id: result.public_id,
                  secure_url: result.secure_url,
                  width: result.width,
                  height: result.height,
                  format: result.format,
                  created_at: result.created_at,
                  tags: result.tags || [],
                  context: result.context?.custom || {},
                  folder: result.folder
                });
              }
            ).end(file.buffer);
          });
        });

        uploadedImages = await Promise.all(uploadPromises);
      }
    }

    // Create memory object
    const memoryId = uploadedImages.length > 0 ? 
      (uploadedImages[0].context?.memory_id || `memory-${Date.now()}`) : 
      `memory-${Date.now()}`;
      
    const memory = {
      id: memoryId,
      title,
      location: location || null,
      text,
      date: date || new Date().toISOString().split('T')[0],
      images: uploadedImages,
      created_at: new Date().toISOString(),
      context: {
        title: title,
        location: location || '',
        memory_date: date,
        memory_id: memoryId
      },
      tags: ['memory', 'love-journal'],
      folder
    };

    // In a real application, you would save this to a database
    // For now, we'll just return the memory object
    console.log('✅ Memory saved successfully:', {
      title,
      location,
      date,
      imageCount: uploadedImages.length
    });

    res.json({
      success: true,
      memory,
      message: 'Memory saved successfully!'
    });

  } catch (error) {
    console.error('❌ Error saving memory:', error);
    res.status(500).json({ 
      error: 'Failed to save memory',
      message: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/cloudinary/memories
 * Fetch memories from Cloudinary
 */
app.get('/api/cloudinary/memories', async (req, res) => {
  try {
    if (!isCloudinaryConfigured) {
      console.log('⚠️ Cloudinary not configured! Please set up environment variables.');
      return res.status(503).json({ 
        error: 'Cloudinary service not configured',
        message: 'Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables'
      });
    }

    const userId = req.query.userId;
    const cacheKey = userId ? `memories_${userId}` : 'memories_all';
    const now = Date.now();
    // Check cache
    if (memoriesCache.has(cacheKey)) {
      const { memories, timestamp } = memoriesCache.get(cacheKey);
      if (memories && Array.isArray(memories) && timestamp && now - timestamp < CACHE_TTL) {
        console.log(`[CACHE] Returning cached memories for ${cacheKey}`);
        return res.json({ memories });
      }
    }
    // Not cached or expired, fetch from Cloudinary
    let memories = await getCloudinaryMemories();
    if (userId) {
      memories = memories.filter(mem => {
        return mem.images.some(img => {
          if (img.context) {
            if (img.context.custom && img.context.custom.userId) {
              return img.context.custom.userId === userId;
            }
            if (img.context.userId) {
              return img.context.userId === userId;
            }
          }
          return false;
        });
      });
    }
    // Save to cache
    memoriesCache.set(cacheKey, { memories, timestamp: now });
    console.log(`[CACHE] Saved memories for ${cacheKey}`);
    return res.json({ memories });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return res.status(500).json({ error: 'Failed to fetch memories' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Server error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message || 'Unknown error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cloudinary Backend Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🖼️  Images API: http://localhost:${PORT}/api/cloudinary/images`);
  console.log(`📤 Upload API: http://localhost:${PORT}/api/cloudinary/upload`);
  console.log(`� Memory API: http://localhost:${PORT}/api/cloudinary/memories`);
  console.log(`�🗑️  Delete API: http://localhost:${PORT}/api/cloudinary/delete`);
  
  if (!isCloudinaryConfigured) {
    console.log('\n⚠️  CLOUDINARY NOT CONFIGURED - Running in mock mode');
    console.log('📝 To enable real Cloudinary features, set these environment variables:');
    console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('   CLOUDINARY_API_KEY=your-api-key');
    console.log('   CLOUDINARY_API_SECRET=your-api-secret');
  }
});

export default app;
