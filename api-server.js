import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import memoryHandler from './api/cloudinary/memory.js';
import memoriesHandler from './api/cloudinary/memories.js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Memory save endpoint
app.post('/api/cloudinary/memory', (req, res) => {
  memoryHandler(req, res).catch(err => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

// Memories fetch endpoint
app.get('/api/cloudinary/memories', (req, res) => {
  memoriesHandler(req, res).catch(err => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ API server running on http://localhost:${PORT}`);
  console.log(`📸 Memory save: POST http://localhost:${PORT}/api/cloudinary/memory`);
  console.log(`📷 Memories fetch: GET http://localhost:${PORT}/api/cloudinary/memories\n`);
});
