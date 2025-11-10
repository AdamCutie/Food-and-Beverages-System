import express from 'express';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    // The 'uploads/' directory is where files will be saved
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // Create a unique filename to avoid naming conflicts
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File validation
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only! (jpg, jpeg, png)'));
  }
}

const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// Define the upload route: POST /api/upload
router.post('/', upload.single('image'), (req, res) => {
  // When the file is uploaded, multer gives us the clean, safe FILENAME.
  // We will build the correct URL path ourselves.
  const imageUrl = `/uploads/${req.file.filename}`;

  // We send back the clean path to be saved in the database.
  res.send({
    message: 'Image Uploaded',
    image: imageUrl, // This will always be a clean /uploads/image-123.jpg
  });
});

export default router;