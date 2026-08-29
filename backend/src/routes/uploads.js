const express = require('express');
const multer = require('multer');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { upload, publicFileUrl } = require('../lib/upload');

const router = express.Router();

router.post(
  '/image',
  authMiddleware,
  requireRole('admin'),
  upload.single('image'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }
      res.status(201).json({
        url: publicFileUrl(req, req.file.filename),
        filename: req.file.filename,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be 8 MB or smaller' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;
