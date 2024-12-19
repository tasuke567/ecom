const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRouter = require('../routes/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed default port to 3001

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://comfronteiei.netlify.app',
    'https://6763d532c703bc000841b72b--comfronteiei.netlify.app',
    // รองรับทุก subdomain ของ netlify
    /\.netlify\.app$/
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/auth', authRouter);

// Health check route
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
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