// updateUserIdForOldImages.js
// Script to update userId for old Cloudinary images (memories) that are missing userId in context.custom
// Usage: node updateUserIdForOldImages.js <USER_ID>

const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: '.env.local' });

if (process.argv.length < 3) {
  console.error('Usage: node updateUserIdForOldImages.js <USER_ID>');
  process.exit(1);
}

const USER_ID = process.argv[2];

// Debug: print env values
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '***' : undefined);

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Missing Cloudinary config. Please check your .env.local file!');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function updateUserIdForOldImages(userId) {
  let nextCursor = undefined;
  let updated = 0;
  do {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'image',
      prefix: 'love-journal/memories/',
      context: true,
      max_results: 100,
      next_cursor: nextCursor
    });
    for (const img of result.resources) {
      const hasUserId = img.context && img.context.custom && img.context.custom.userId;
      if (!hasUserId) {
        await cloudinary.uploader.add_context(
          { userId: userId },
          img.public_id
        );
        console.log(`Updated userId for: ${img.public_id}`);
        updated++;
      }
    }
    nextCursor = result.next_cursor;
  } while (nextCursor);
  console.log(`Done. Updated ${updated} images.`);
}

updateUserIdForOldImages(USER_ID).catch(err => {
  console.error('Error updating images:', err);
});
