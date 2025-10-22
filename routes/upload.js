const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
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

router.post('/', auth, upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'File upload failed' });
  }
  return res.json({ imageUrl: req.file.path });
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