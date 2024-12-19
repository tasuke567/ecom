const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed default port to 3001

app.use(cors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    app.listen(PORT, '127.0.0.1', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();