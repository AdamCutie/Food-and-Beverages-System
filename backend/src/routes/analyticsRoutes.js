import express from "express";
import { getDashboardAnalytics } from "../controllers/analyticsController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// This route is protected and only accessible by admins
router.get("/", protect, authorizeRoles("admin"), getDashboardAnalytics);

export default router;