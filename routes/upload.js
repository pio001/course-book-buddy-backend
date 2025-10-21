const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary using env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Only allow image mimetypes
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

// Memory storage (serverless-friendly)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Admin/inventory manager only
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'inventory_manager') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'unibookshop';
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ msg: 'Upload failed' });
        }
        return res.json({ url: result.secure_url, public_id: result.public_id });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Upload failed' });
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