/**
 * Verify migration results - Check if images are in new structure
 */

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || process.env.VITE_CLOUDINARY_API_SECRET,
});

async function verifyMigration() {
  console.log('🔍 Verifying migration results...\n');
  
  const envPrefix = process.env.CLOUDINARY_FOLDER_PREFIX || '';
  
  // Check old structure
  const oldFolder = envPrefix 
    ? `${envPrefix}/love-journal/memories`
    : 'love-journal/memories';
  
  console.log(`📁 Checking OLD structure: ${oldFolder}/**`);
  
  try {
    const oldResult = await cloudinary.search
      .expression(`folder:${oldFolder}/*`)
      .max_results(10)
      .execute();
    
    console.log(`  Found ${oldResult.resources.length} images in OLD structure`);
    if (oldResult.resources.length > 0) {
      console.log(`  Sample paths:`);
      oldResult.resources.slice(0, 3).forEach(r => {
        console.log(`    - ${r.public_id}`);
      });
    }
  } catch (e) {
    console.log(`  ✅ No images found (expected after migration)`);
  }
  
  // Check new structure
  const newFolder = envPrefix 
    ? `${envPrefix}/love-journal/users`
    : 'love-journal/users';
  
  console.log(`\n📁 Checking NEW structure: ${newFolder}/**`);
  
  try {
    const newResult = await cloudinary.search
      .expression(`folder:${newFolder}/*`)
      .max_results(10)
      .execute();
    
    console.log(`  Found ${newResult.resources.length} images in NEW structure`);
    if (newResult.resources.length > 0) {
      console.log(`  Sample paths:`);
      newResult.resources.slice(0, 5).forEach(r => {
        console.log(`    - ${r.public_id}`);
      });
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
  
  console.log('\n✅ Verification complete!\n');
}

verifyMigration().catch(console.error);
