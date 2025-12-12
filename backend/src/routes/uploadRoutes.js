import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorizeRoles } from "../middleware/authMiddleware.js"; 

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
// ✅ Now 'protect' and 'authorizeRoles' are defined because we imported them above
router.post('/', protect, authorizeRoles("F&B Admin"), upload.single('image'), (req, res) => {
  if (!req.file) {
      return res.status(400).send({ message: "No file uploaded" });
  }
  // When the file is uploaded successfully, multer adds a 'file' object to the request.
  // We send back the path to the file, which we will save in the database.
  res.send({
    message: 'Image Uploaded',
    image: `/${req.file.path}`,
  });
});

export default router;