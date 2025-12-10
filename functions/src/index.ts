import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

/**
 * Extract publicId from Cloudinary URL
 * Example: https://res.cloudinary.com/dhelefhv1/image/upload/v1765358332/dev/love-journal/users/.../image.jpg
 * Returns: dev/love-journal/users/.../image (without extension)
 */
const extractPublicIdFromUrl = (urlOrPublicId: string): string => {
  // If it's not a URL, return as-is
  if (!urlOrPublicId.startsWith('http://') && !urlOrPublicId.startsWith('https://')) {
    return urlOrPublicId;
  }

  try {
    const url = new URL(urlOrPublicId);
    const pathParts = url.pathname.split('/');
    
    // Find the index of 'upload' in the path
    const uploadIndex = pathParts.indexOf('upload');
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL format');
    }
    
    // Get everything after 'upload' and version (v1234567890)
    // Skip the version part (starts with 'v' followed by numbers)
    let startIndex = uploadIndex + 1;
    if (pathParts[startIndex]?.match(/^v\d+$/)) {
      startIndex++;
    }
    
    // Join the remaining parts
    const publicIdWithExtension = pathParts.slice(startIndex).join('/');
    
    // Remove file extension
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    const publicId = lastDotIndex > 0 
      ? publicIdWithExtension.substring(0, lastDotIndex)
      : publicIdWithExtension;
    
    return publicId;
  } catch (error) {
    console.error('Error extracting publicId from URL:', error);
    return urlOrPublicId; // Return original if parsing fails
  }
};

/**
 * Delete an image from Cloudinary
 * Requires Firebase Authentication
 */
export const deleteCloudinaryImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Parse request body
      const { data } = req.body;
      const { publicId: publicIdOrUrl } = data || {};

      // Get auth token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.error('No auth token provided');
        res.status(401).json({
          error: {
            message: 'Unauthenticated',
            status: 'UNAUTHENTICATED'
          }
        });
        return;
      }

      const idToken = authHeader.split('Bearer ')[1];
      
      // Verify Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log('Authenticated user:', decodedToken.uid);

      // Validate input
      if (!publicIdOrUrl || typeof publicIdOrUrl !== 'string') {
        console.error('Invalid publicId:', publicIdOrUrl);
        res.status(400).json({
          error: {
            message: 'Invalid argument: publicId is required',
            status: 'INVALID_ARGUMENT'
          }
        });
        return;
      }

      // Extract publicId from URL if necessary
      const publicId = extractPublicIdFromUrl(publicIdOrUrl);
      console.log('Original input:', publicIdOrUrl);
      console.log('Extracted publicId:', publicId);

      // Configure Cloudinary
      cloudinary.config({
        cloud_name: 'dhelefhv1',
        api_key: '296369272882129',
        api_secret: '7WW0ObOcq-km2joUueUrCtkVjJQ',
      });

      console.log(`Attempting to delete: ${publicId}`);

      // Delete the image from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId, {
        invalidate: true,
      });

      console.log('Cloudinary response:', result);

      if (result.result === 'ok' || result.result === 'not found') {
        res.status(200).json({
          result: {
            success: true,
            result: result.result,
            message: result.result === 'not found' 
              ? 'Image already deleted or not found' 
              : 'Image deleted successfully',
          }
        });
      } else {
        res.status(500).json({
          error: {
            message: `Failed to delete image: ${result.result}`,
            status: 'INTERNAL'
          }
        });
      }
    } catch (error: any) {
      console.error('Error:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Internal error',
          status: 'INTERNAL'
        }
      });
    }
  });
});
