import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

// We ONLY import the 'getDashboardSummary' function,
// because it's the only one we need.
import { getDashboardSummary } from "../controllers/dashboardController.js";

const router = express.Router();

/**
 * @route   GET /api/dashboard/summary
 * @desc    Get all dashboard summary data in one request
 * @access  Private (Admin)
 */
router.get("/summary", protect, authorizeRoles("admin","employee"), getDashboardSummary);

// ALL OTHER ROUTES ARE REMOVED.
// This fixes the 'ReferenceError' crash because
// we are no longer trying to use variables
// that are not defined (like 'salesGrowth').

export default router;