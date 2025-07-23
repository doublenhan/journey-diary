module.exports = (req, res) => {
  console.log('[Test API] /api/test route hit');
  res.status(200).json({ message: 'Test route working', method: req.method });
};
