import express from "express";
import {
    getAllItems,
    getItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
} from "../controllers/itemController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes
router.get("/", getAllItems);
router.get("/:id", getItemById); // <-- FIX: This route was missing.

// Admin-Only Routes
router.post("/", protect, authorizeRoles('admin'), createMenuItem);
router.put("/:id", protect, authorizeRoles('admin'), updateMenuItem);
router.delete("/:id", protect, authorizeRoles('admin'), deleteMenuItem);

export default router;