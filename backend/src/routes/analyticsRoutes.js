import express from "express";
import { getDashboardAnalytics } from "../controllers/analyticsController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// UPDATED: Only 'F&B Admin' can view analytics
router.get("/", protect, authorizeRoles("F&B Admin"), getDashboardAnalytics);

export default router;