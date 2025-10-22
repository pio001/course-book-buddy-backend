const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Debug environment variables
console.log('Cloudinary Config Check:');
console.log('CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('API_KEY:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'course-book-buddy',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// Test endpoint to verify Cloudinary configuration
router.get('/test', (req, res) => {
  try {
    const config = cloudinary.config();
    return res.json({
      status: 'Cloudinary configuration test',
      cloud_name: config.cloud_name ? 'Set' : 'Missing',
      api_key: config.api_key ? 'Set' : 'Missing',
      api_secret: config.api_secret ? 'Set' : 'Missing',
      config_valid: !!(config.cloud_name && config.api_key && config.api_secret)
    });
  } catch (error) {
    return res.status(500).json({ error: 'Cloudinary config test failed', details: error.message });
  }
});

router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (!req.file.path) {
      return res.status(400).json({ error: 'File upload failed - no path returned' });
    }
    
    // Return the secure Cloudinary URL
    return res.json({ 
      imageUrl: req.file.path,
      secure_url: req.file.path,
      public_id: req.file.filename
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Optional delete endpoint
router.delete('/:publicId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'inventory_manager') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);
    return res.json({ msg: 'Deleted', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Delete failed' });
  }
});

module.exports = router;