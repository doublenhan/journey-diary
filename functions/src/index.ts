import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Firebase Admin
admin.initializeApp();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Delete an image from Cloudinary
 * Requires Firebase Authentication
 */
export const deleteCloudinaryImage = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated to delete images'
    );
  }

  const { publicId } = data;

  // Validate input
  if (!publicId || typeof publicId !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'publicId is required and must be a string'
    );
  }

  try {
    console.log(`Deleting image from Cloudinary: ${publicId} by user: ${context.auth.uid}`);

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true, // Invalidate CDN cache
    });

    console.log('Cloudinary delete result:', result);

    if (result.result === 'ok' || result.result === 'not found') {
      return {
        success: true,
        result: result.result,
        message: result.result === 'not found' 
          ? 'Image already deleted or not found' 
          : 'Image deleted successfully',
      };
    } else {
      throw new functions.https.HttpsError(
        'internal',
        `Failed to delete image: ${result.result}`
      );
    }
  } catch (error: any) {
    console.error('Error deleting from Cloudinary:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to delete image from Cloudinary'
    );
  }
});
