import express from 'express';
import { addRating, getItemReviews } from '../controllers/ratingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public: View reviews
router.get('/:itemId', getItemReviews);

// Protected: Post a review (Must be logged in)
router.post('/', protect, addRating);

export default router;