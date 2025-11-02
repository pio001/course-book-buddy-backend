const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/connectDB');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
// Removed local uploads static directory - using Cloudinary URLs now

// No need for prefix on Render - always use /api
const prefix = '/api';

// Connect to MongoDB (cached) with fallback
(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection failed, continuing without DB:', error.message);
  }
})();

// Routes
app.use(`${prefix}/auth`, require('./routes/auth'));
app.use(`${prefix}/users`, require('./routes/users'));
app.use(`${prefix}/books`, require('./routes/books'));
app.use(`${prefix}/courses`, require('./routes/courses'));
app.use(`${prefix}/departments`, require('./routes/departments'));
app.use(`${prefix}/orders`, require('./routes/orders'));
app.use(`${prefix}/cart`, require('./routes/cart'));
app.use(`${prefix}/wishlist`, require('./routes/wishlist'));
app.use(`${prefix}/reviews`, require('./routes/reviews'));
app.use(`${prefix}/upload`, require('./routes/upload'));
app.use(`${prefix}/paystack`, require('./routes/paystack'));

// Health check endpoint
app.get(`${prefix}/health`, (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default route
app.get('/', (req, res) => {
  res.send('UniBookshop API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));