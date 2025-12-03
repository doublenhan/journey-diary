/**
 * Migration Script: Move existing Cloudinary images to new folder structure
 * 
 * Old structure: love-journal/memories/{year}/
 * New structure: love-journal/users/{userId}/{year}/{month}/memories/
 * 
 * Run: node scripts/migrateToUserFolderStructure.cjs
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary - support both VITE_ prefixed and non-prefixed vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
});

// Month names mapping
const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

// Helper to extract userId from context
function extractUserIdFromContext(context) {
  if (!context || !context.custom) return null;
  
  // Try to parse context string (format: key=value|key=value)
  const contextStr = context.custom;
  const pairs = contextStr.split('|');
  
  for (const pair of pairs) {
    const [key, value] = pair.split('=');
    if (key === 'userId' && value) {
      return value;
    }
  }
  
  return null;
}

// Helper to extract date from context or filename
function extractDate(resource) {
  // Try context first
  if (resource.context && resource.context.custom) {
    const contextStr = resource.context.custom;
    const pairs = contextStr.split('|');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key === 'memory_date' && value) {
        return new Date(value);
      }
    }
  }
  
  // Fallback to created_at
  return new Date(resource.created_at);
}

// Generate new folder path
function generateNewFolder(userId, date) {
  const year = date.getFullYear();
  const month = monthNames[date.getMonth()];
  
  return `love-journal/users/${userId}/${year}/${month}/memories`;
}

// Main migration function
async function migrateImages() {
  console.log('🚀 Starting Cloudinary folder structure migration...\n');
  
  try {
    // Get environment prefix
    const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
    console.log(`📁 Environment prefix: ${envPrefix || '(none)'}\n`);
    
    // Search for all images in old structure
    const oldFolder = envPrefix 
      ? `${envPrefix}/love-journal/memories`
      : 'love-journal/memories';
    
    console.log(`🔍 Searching for images in: ${oldFolder}/**`);
    
    let allResources = [];
    let nextCursor = null;
    
    do {
      const result = await cloudinary.search
        .expression(`folder:${oldFolder}/*`)
        .with_field('tags')
        .with_field('context')
        .max_results(500)
        .next_cursor(nextCursor)
        .execute();
      
      allResources = allResources.concat(result.resources);
      nextCursor = result.next_cursor;
      
      console.log(`  Found ${result.resources.length} images (total: ${allResources.length})`);
    } while (nextCursor);
    
    console.log(`\n✅ Total images found: ${allResources.length}\n`);
    
    if (allResources.length === 0) {
      console.log('ℹ️  No images to migrate. Exiting.');
      return;
    }
    
    // Group images by userId
    const imagesByUser = {};
    const noUserIdImages = [];
    
    for (const resource of allResources) {
      const userId = extractUserIdFromContext(resource);
      
      if (userId) {
        if (!imagesByUser[userId]) {
          imagesByUser[userId] = [];
        }
        imagesByUser[userId].push(resource);
      } else {
        noUserIdImages.push(resource);
      }
    }
    
    console.log(`📊 Migration summary:`);
    console.log(`  - Images with userId: ${allResources.length - noUserIdImages.length}`);
    console.log(`  - Images without userId: ${noUserIdImages.length}`);
    console.log(`  - Unique users: ${Object.keys(imagesByUser).length}\n`);
    
    // Handle images without userId
    if (noUserIdImages.length > 0) {
      console.log(`⚠️  WARNING: ${noUserIdImages.length} images have no userId in context.`);
      console.log(`   These will be moved to: love-journal/users/anonymous/{year}/{month}/memories\n`);
      
      imagesByUser['anonymous'] = noUserIdImages;
    }
    
    // Migrate images for each user
    let successCount = 0;
    let errorCount = 0;
    
    for (const [userId, resources] of Object.entries(imagesByUser)) {
      console.log(`\n👤 Migrating ${resources.length} images for user: ${userId}`);
      
      for (const resource of resources) {
        try {
          const date = extractDate(resource);
          const newFolder = generateNewFolder(userId, date);
          const fullNewFolder = envPrefix ? `${envPrefix}/${newFolder}` : newFolder;
          
          // Extract filename from public_id
          const pathParts = resource.public_id.split('/');
          const filename = pathParts[pathParts.length - 1];
          
          const newPublicId = `${fullNewFolder}/${filename}`;
          
          // Check if already in new structure
          if (resource.public_id === newPublicId) {
            console.log(`  ⏭️  Skipping (already migrated): ${filename}`);
            successCount++;
            continue;
          }
          
          // Rename (move) the image
          await cloudinary.uploader.rename(
            resource.public_id,
            newPublicId,
            { overwrite: false, invalidate: true }
          );
          
          console.log(`  ✅ Moved: ${filename}`);
          console.log(`     From: ${resource.public_id}`);
          console.log(`     To:   ${newPublicId}`);
          
          successCount++;
          
          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`  ❌ Error migrating ${resource.public_id}:`, error.message);
          errorCount++;
        }
      }
    }
    
    console.log(`\n\n🎉 Migration completed!`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📊 Total: ${allResources.length}\n`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
console.log('═'.repeat(60));
console.log('  CLOUDINARY FOLDER STRUCTURE MIGRATION');
console.log('═'.repeat(60));
console.log();

migrateImages()
  .then(() => {
    console.log('✨ Migration script finished successfully!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
