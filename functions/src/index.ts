import * as functions from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
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
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
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

/**
 * Scheduled function to calculate and store system-wide storage statistics
 * Runs every 12 hours to update stats for admin dashboard (twice per day)
 */
export const calculateStorageStats = onSchedule('every 12 hours', async () => {
  try {
    console.log('Starting storage stats calculation...');
    
    const db = admin.firestore();
    const ENV_PREFIX = process.env.FIREBASE_ENV === 'production' ? '' : 'dev_';
    
    // Get all collections
    const usersCollection = `${ENV_PREFIX}users`;
    const memoriesCollection = `${ENV_PREFIX}memories`;
    
    // Count documents
    const [usersSnapshot, memoriesSnapshot] = await Promise.all([
      db.collection(usersCollection).get(),
      db.collection(memoriesCollection).get()
    ]);
    
    const usersCount = usersSnapshot.size;
    const memoriesCount = memoriesSnapshot.size;
    
    // Calculate Cloudinary usage
    let totalImages = 0;
    let estimatedImageStorageMB = 0;
    
    memoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      const images = data.cloudinaryPublicIds || data.photos || [];
      totalImages += images.length;
      // Estimate: Average optimized image ~500KB (WebP compression)
      estimatedImageStorageMB += (images.length * 0.5);
    });
    
    // Calculate Firebase storage estimate
    // Average: ~5KB for users, ~10KB for memories with metadata
    const estimatedDbStorageMB = ((usersCount * 5) + (memoriesCount * 10)) / 1024;
    
    // Estimate Firestore operations per day
    // Assumptions:
    // - Each user logs in ~2 times/day (2 reads: user doc + auth check)
    // - Each user views ~5 memories/day (5 reads)
    // - Each user creates ~0.5 memories/day (1 write every 2 days)
    // - Dashboard and list views cause additional reads
    const estimatedReadsPerDay = (usersCount * 7) + (memoriesCount * 0.1); // Login + views + misc
    const estimatedWritesPerDay = (usersCount * 0.5); // Create/update memories
    
    // Prepare stats object
    const stats = {
      firebase: {
        documentsCount: usersCount + memoriesCount,
        estimatedStorageMB: parseFloat(estimatedDbStorageMB.toFixed(2)),
        usersCount,
        memoriesCount,
        limit: {
          storageLimitGB: 1,
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      authentication: {
        totalUsers: usersCount,
        limit: {
          monthlyActiveUsers: 50000 // Spark plan limit
        }
      },
      cloudFunctions: {
        totalFunctions: 3, // deleteCloudinaryImage, calculateStorageStats, updateStorageStats
        estimatedInvocationsPerDay: memoriesCount * 2, // Rough estimate based on memory operations
        limit: {
          invocationsPerMonth: 125000, // Spark plan limit
          gbSeconds: 40000,
          cpuSeconds: 200000
        }
      },
      firestoreOperations: {
        estimatedReadsPerDay: Math.round(estimatedReadsPerDay),
        estimatedWritesPerDay: Math.round(estimatedWritesPerDay),
        limit: {
          readsPerDay: 50000,
          writesPerDay: 20000
        }
      },
      cloudinary: {
        usedStorageMB: parseFloat(estimatedImageStorageMB.toFixed(2)),
        totalImages,
        limit: {
          storageLimitGB: 25,
          transformationsPerMonth: 25000,
          bandwidthGB: 25
        }
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      calculatedAt: new Date().toISOString()
    };
    
    // Store in system_stats collection
    await db.collection('system_stats').doc('storage').set(stats);
    
    console.log('Storage stats calculated and stored:', {
      users: usersCount,
      memories: memoriesCount,
      images: totalImages,
      dbStorageMB: estimatedDbStorageMB,
      imageStorageMB: estimatedImageStorageMB
    });
    
  } catch (error) {
    console.error('Error calculating storage stats:', error);
    throw error;
  }
});

/**
 * HTTP function to manually trigger storage stats calculation
 * Can be called by admins to get fresh stats immediately
 */
export const updateStorageStats = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Verify admin authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      // Check if user is admin
      const db = admin.firestore();
      const ENV_PREFIX = process.env.FIREBASE_ENV === 'production' ? '' : 'dev_';
      const userDoc = await db.collection(`${ENV_PREFIX}users`).doc(decodedToken.uid).get();
      const userData = userDoc.data();
      
      if (!userData || userData.role !== 'SysAdmin') {
        res.status(403).json({ error: 'Forbidden: Admin access required' });
        return;
      }
      
      // Calculate and store stats (same logic as scheduled function)
      const usersCollection = `${ENV_PREFIX}users`;
      const memoriesCollection = `${ENV_PREFIX}memories`;
      
      const [usersSnapshot, memoriesSnapshot] = await Promise.all([
        db.collection(usersCollection).get(),
        db.collection(memoriesCollection).get()
      ]);
      
      const usersCount = usersSnapshot.size;
      const memoriesCount = memoriesSnapshot.size;
      
      let totalImages = 0;
      let estimatedImageStorageMB = 0;
      
      memoriesSnapshot.forEach((doc) => {
        const data = doc.data();
        const images = data.cloudinaryPublicIds || data.photos || [];
        totalImages += images.length;
        estimatedImageStorageMB += (images.length * 0.5);
      });
      
      const estimatedDbStorageMB = ((usersCount * 5) + (memoriesCount * 10)) / 1024;
      
      const estimatedReadsPerDay = (usersCount * 7) + (memoriesCount * 0.1);
      const estimatedWritesPerDay = (usersCount * 0.5);
      
      const stats = {
        firebase: {
          documentsCount: usersCount + memoriesCount,
          estimatedStorageMB: parseFloat(estimatedDbStorageMB.toFixed(2)),
          usersCount,
          memoriesCount,
          limit: {
            storageLimitGB: 1,
            readsPerDay: 50000,
            writesPerDay: 20000
          }
        },
        authentication: {
          totalUsers: usersCount,
          limit: {
            monthlyActiveUsers: 50000
          }
        },
        cloudFunctions: {
          totalFunctions: 3,
          estimatedInvocationsPerDay: memoriesCount * 2,
          limit: {
            invocationsPerMonth: 125000,
            gbSeconds: 40000,
            cpuSeconds: 200000
          }
        },
        firestoreOperations: {
          estimatedReadsPerDay: Math.round(estimatedReadsPerDay),
          estimatedWritesPerDay: Math.round(estimatedWritesPerDay),
          limit: {
            readsPerDay: 50000,
            writesPerDay: 20000
          }
        },
        cloudinary: {
          usedStorageMB: parseFloat(estimatedImageStorageMB.toFixed(2)),
          totalImages,
          limit: {
            storageLimitGB: 25,
            transformationsPerMonth: 25000,
            bandwidthGB: 25
          }
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        calculatedAt: new Date().toISOString()
      };
      
      await db.collection('system_stats').doc('storage').set(stats);
      
      res.status(200).json({
        success: true,
        stats
      });
    } catch (error: any) {
      console.error('Error updating storage stats:', error);
      res.status(500).json({
        error: {
          message: error.message || 'Internal error',
          status: 'INTERNAL'
        }
      });
    }
  });
});
