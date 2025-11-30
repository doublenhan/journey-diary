// api/cloudinary/health.js
export default function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ status: 'error', message: error.message });
  }
}
