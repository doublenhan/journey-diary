/**
 * Test Firebase Services - V3.0
 * Quick test to verify Firebase Direct services work correctly
 */

import { 
  createMemory, 
  fetchMemories, 
  subscribeToMemories,
  updateMemory,
  deleteMemory,
} from './firebaseMemoriesService';

import {
  createAnniversary,
  fetchAnniversaries,
  subscribeToAnniversaries,
  deleteAnniversary,
} from './firebaseAnniversaryService';

import {
  uploadToCloudinary,
  generateCloudinaryUrl,
  generateThumbnail,
} from './cloudinaryDirectService';

// Test user ID (replace with actual authenticated user ID)
const TEST_USER_ID = 'test-user-123';

/**
 * Test 1: Memory CRUD operations
 */
export const testMemoryCRUD = async () => {
  console.log('🧪 Testing Memory CRUD...');
  
  try {
    // Create a test memory
    console.log('1. Creating memory...');
    const newMemory = await createMemory({
      userId: TEST_USER_ID,
      title: 'Test Memory',
      description: 'This is a test memory from V3.0 services',
      mood: 'happy',
      photos: [],
      tags: ['test', 'v3'],
    });
    console.log('✅ Memory created:', newMemory.id);

    // Fetch memories
    console.log('2. Fetching memories...');
    const memories = await fetchMemories({
      userId: TEST_USER_ID,
      limit: 10,
    });
    console.log(`✅ Fetched ${memories.length} memories`);

    // Update memory
    console.log('3. Updating memory...');
    await updateMemory(newMemory.id, {
      title: 'Updated Test Memory',
      mood: 'excited',
    });
    console.log('✅ Memory updated');

    // Delete memory
    console.log('4. Deleting memory...');
    await deleteMemory(newMemory.id);
    console.log('✅ Memory deleted');

    console.log('✅ Memory CRUD test passed!');
    return true;
  } catch (error) {
    console.error('❌ Memory CRUD test failed:', error);
    return false;
  }
};

/**
 * Test 2: Real-time subscription
 */
export const testRealTimeSubscription = () => {
  console.log('🧪 Testing Real-time Subscription...');
  
  return new Promise((resolve) => {
    try {
      let updateCount = 0;
      
      const unsubscribe = subscribeToMemories(
        { userId: TEST_USER_ID, limit: 5 },
        (memories) => {
          updateCount++;
          console.log(`🔄 Real-time update #${updateCount}: ${memories.length} memories`);
          
          if (updateCount >= 1) {
            console.log('✅ Real-time subscription test passed!');
            unsubscribe();
            resolve(true);
          }
        },
        (error) => {
          console.error('❌ Real-time subscription error:', error);
          resolve(false);
        }
      );

      // Cleanup after 5 seconds if no updates
      setTimeout(() => {
        unsubscribe();
        if (updateCount === 0) {
          console.warn('⚠️ No real-time updates received');
        }
        resolve(updateCount > 0);
      }, 5000);
    } catch (error) {
      console.error('❌ Real-time subscription test failed:', error);
      resolve(false);
    }
  });
};

/**
 * Test 3: Anniversary CRUD operations
 */
export const testAnniversaryCRUD = async () => {
  console.log('🧪 Testing Anniversary CRUD...');
  
  try {
    // Create a test anniversary
    console.log('1. Creating anniversary...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    const newAnniversary = await createAnniversary({
      userId: TEST_USER_ID,
      title: 'Test Anniversary',
      date: futureDate,
      description: 'Test anniversary event',
      type: 'anniversary',
      recurring: true,
      notifyDaysBefore: 7,
    });
    console.log('✅ Anniversary created:', newAnniversary.id);

    // Fetch anniversaries
    console.log('2. Fetching anniversaries...');
    const anniversaries = await fetchAnniversaries({
      userId: TEST_USER_ID,
      upcomingOnly: true,
    });
    console.log(`✅ Fetched ${anniversaries.length} anniversaries`);

    // Delete anniversary
    console.log('3. Deleting anniversary...');
    await deleteAnniversary(newAnniversary.id);
    console.log('✅ Anniversary deleted');

    console.log('✅ Anniversary CRUD test passed!');
    return true;
  } catch (error) {
    console.error('❌ Anniversary CRUD test failed:', error);
    return false;
  }
};

/**
 * Test 4: Cloudinary URL generation
 */
export const testCloudinaryURLs = () => {
  console.log('🧪 Testing Cloudinary URL generation...');
  
  try {
    const testPublicId = 'test/sample-image';
    
    // Generate standard URL
    const standardUrl = generateCloudinaryUrl(testPublicId, {
      width: 800,
      crop: 'limit',
      format: 'auto',
      quality: 'auto',
    });
    console.log('✅ Standard URL:', standardUrl);

    // Generate thumbnail
    const thumbnailUrl = generateThumbnail(testPublicId, 'medium');
    console.log('✅ Thumbnail URL:', thumbnailUrl);

    console.log('✅ Cloudinary URL generation test passed!');
    return true;
  } catch (error) {
    console.error('❌ Cloudinary URL generation test failed:', error);
    return false;
  }
};

/**
 * Test 5: Cloudinary Upload (requires actual file)
 * This test is commented out because it requires user interaction
 */
export const testCloudinaryUpload = async (file: File) => {
  console.log('🧪 Testing Cloudinary Upload...');
  
  try {
    let progress = 0;
    
    const result = await uploadToCloudinary(
      file,
      {
        folder: 'test-uploads',
        tags: ['test', 'v3'],
        userId: TEST_USER_ID,
      },
      (uploadProgress) => {
        progress = uploadProgress;
        console.log(`📤 Upload progress: ${progress}%`);
      }
    );

    console.log('✅ Upload completed:', result.public_id);
    console.log('📷 Secure URL:', result.secure_url);
    console.log('🖼️ Thumbnail URL:', result.thumbnail_url);
    console.log('✨ Optimized URL:', result.optimized_url);

    return true;
  } catch (error) {
    console.error('❌ Cloudinary upload test failed:', error);
    return false;
  }
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('🚀 Starting V3.0 Services Tests...\n');
  
  const results = {
    memoryCRUD: false,
    realTime: false,
    anniversaryCRUD: false,
    cloudinaryURLs: false,
  };

  // Test 1: Memory CRUD
  results.memoryCRUD = await testMemoryCRUD();
  console.log('\n---\n');

  // Test 2: Real-time subscription
  results.realTime = (await testRealTimeSubscription()) as boolean;
  console.log('\n---\n');

  // Test 3: Anniversary CRUD
  results.anniversaryCRUD = await testAnniversaryCRUD();
  console.log('\n---\n');

  // Test 4: Cloudinary URLs
  results.cloudinaryURLs = testCloudinaryURLs();
  console.log('\n---\n');

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('Memory CRUD:', results.memoryCRUD ? '✅ PASS' : '❌ FAIL');
  console.log('Real-time Subscription:', results.realTime ? '✅ PASS' : '❌ FAIL');
  console.log('Anniversary CRUD:', results.anniversaryCRUD ? '✅ PASS' : '❌ FAIL');
  console.log('Cloudinary URLs:', results.cloudinaryURLs ? '✅ PASS' : '❌ FAIL');

  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalCount} tests passed`);
  
  return results;
};

// Export for use in dev console
if (typeof window !== 'undefined') {
  (window as any).testFirebaseServices = {
    testMemoryCRUD,
    testRealTimeSubscription,
    testAnniversaryCRUD,
    testCloudinaryURLs,
    testCloudinaryUpload,
    runAllTests,
  };
  
  console.log('💡 Firebase Services tests available in window.testFirebaseServices');
  console.log('Run: window.testFirebaseServices.runAllTests()');
}

export default {
  testMemoryCRUD,
  testRealTimeSubscription,
  testAnniversaryCRUD,
  testCloudinaryURLs,
  testCloudinaryUpload,
  runAllTests,
};
