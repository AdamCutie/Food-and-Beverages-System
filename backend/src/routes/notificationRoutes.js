import express from "express";
import {
  getMyNotifications,
  markNotificationsAsRead,
  deleteNotificationById, // <-- IMPORT NEW
  clearAllNotifications, // <-- IMPORT NEW
} from "../controllers/notificationController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// These routes are only for logged-in customers
router.use(protect, authorizeRoles("customer", "F&B Admin", "Waiter", "Kitchen Staffs", "Cashier"));

// GET /api/notifications
router.get("/", getMyNotifications);

// PUT /api/notifications/mark-read
router.put("/mark-read", markNotificationsAsRead);

// --- NEW ROUTE 1 ---
// DELETE /api/notifications/clear-all
router.delete("/clear-all", clearAllNotifications);

// --- NEW ROUTE 2 ---
// DELETE /api/notifications/:id
router.delete("/:id", deleteNotificationById);

export default router;