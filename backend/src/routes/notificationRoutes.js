import express from "express";
import {
  getMyNotifications,
  markNotificationsAsRead,
} from "../controllers/notificationController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// These routes are only for logged-in customers
router.use(protect, authorizeRoles("customer"));

// GET /api/notifications
router.get("/", getMyNotifications);

// PUT /api/notifications/mark-read
router.put("/mark-read", markNotificationsAsRead);

export default router;