const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed default port to 3001

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://comfronteiei.netlify.app',
    'https://6763c5ae3d1a0800085f0e92--comfronteiei.netlify.app'
  ],
  credentials: true
}));
  app.use(express.json());
  
  // Health check route
  app.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
  });

// Add the placeholder route
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  res.json({
    url: `https://via.placeholder.com/${width}x${height}`,
    width,
    height
  });
});

async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI); // ลบ options ที่ไม่จำเป็นออก
    console.log('MongoDB Connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
}

startServer();