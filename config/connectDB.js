const mongoose = require('mongoose');

let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not set');

    console.log('Connecting to MongoDB...');
    cached.promise = mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 5000,
      connectTimeoutMS: 3000,
      maxPoolSize: 5,
      family: 4
    })
    .then((m) => {
      console.log('✅ MongoDB connected');
      return m;
    })
    .catch((err) => {
      console.error('❌ MongoDB error:', err);
      cached.promise = null;
      throw err;
    });
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
  );

  cached.conn = await Promise.race([cached.promise, timeoutPromise]);
  global.mongoose = cached;
  return cached.conn;
}

module.exports = connectDB;