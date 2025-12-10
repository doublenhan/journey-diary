import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { v2 as cloudinary } from 'cloudinary';
import cors from 'cors';

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS
const corsHandler = cors({ origin: true });

/**
 * Delete an image from Cloudinary
 * Requires Firebase Authentication
 */
export const deleteCloudinaryImage = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Parse request body
      const { data } = req.body;
      const { publicId } = data || {};

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
      if (!publicId || typeof publicId !== 'string') {
        console.error('Invalid publicId:', publicId);
        res.status(400).json({
          error: {
            message: 'Invalid argument: publicId is required',
            status: 'INVALID_ARGUMENT'
          }
        });
        return;
      }

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
