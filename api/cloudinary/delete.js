import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  // Set proper content type
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'DELETE' || req.method === 'POST') {
    try {
      // Re-config cloudinary for this request
      const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
      const api_key = process.env.CLOUDINARY_API_KEY;
      const api_secret = process.env.CLOUDINARY_API_SECRET;
      
      // Check credentials
      if (!cloud_name || !api_key || !api_secret) {
        console.error('Missing Cloudinary config for delete');
        return res.status(403).json({ error: 'Cloudinary not configured' });
      }
      
      // Update config
      cloudinary.config({
        cloud_name,
        api_key,
        api_secret,
      });
      
      // Support both single public_id and multiple publicIds
      const { public_id, publicIds } = req.body;
      const idsToDelete = publicIds || (public_id ? [public_id] : []);
      
      if (!idsToDelete || idsToDelete.length === 0) {
        return res.status(400).json({ error: 'public_id or publicIds array is required' });
      }
      
      console.log(`🗑️ Deleting ${idsToDelete.length} images from Cloudinary`);
      
      // Delete images in parallel
      const deletePromises = idsToDelete.map(id => 
        cloudinary.uploader.destroy(id, { invalidate: true })
          .catch(err => {
            console.error(`Failed to delete ${id}:`, err);
            return { result: 'error', public_id: id, error: err.message };
          })
      );
      
      const results = await Promise.all(deletePromises);
      
      const successful = results.filter(r => r.result === 'ok').length;
      const failed = results.filter(r => r.result !== 'ok');
      
      console.log(`✅ Deleted ${successful}/${idsToDelete.length} images`);
      
      if (failed.length > 0) {
        console.warn('Failed deletions:', failed);
      }
      
      // Return single result format for backwards compatibility
      if (public_id && !publicIds) {
        return res.status(200).json({ 
          result: results[0].result, 
          timestamp: new Date().toISOString() 
        });
      }
      
      return res.status(200).json({
        success: true,
        deleted: successful,
        failed: failed.length,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete image', message: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
