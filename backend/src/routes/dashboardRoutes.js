import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get dashboard summary data
 * @access  Private (F&B Admin)
 */
// UPDATED: Only 'F&B Admin' can view the dashboard summary
router.get("/summary", protect, authorizeRoles("F&B Admin"), getDashboardSummary);

export default router;