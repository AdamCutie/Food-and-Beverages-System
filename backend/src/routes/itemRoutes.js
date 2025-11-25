import express from "express";
import {
    getAllItems,
    getItemById,
    // We import the admin actions here if we want to define them in this file,
    // but typically they are used in adminRoutes. 
    // If your frontend calls /api/items for public viewing, this is fine.
} from "../controllers/itemController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes (Menu Page)
// No protection needed for viewing the menu
router.get("/", getAllItems);
router.get("/:id", getItemById); 

// Note: The Create/Update/Delete routes for items are currently in adminRoutes.js
// If you want them here instead, you can uncomment and update them:
// router.post("/", protect, authorizeRoles("F&B Admin"), createMenuItem);
// router.put("/:id", protect, authorizeRoles("F&B Admin"), updateMenuItem);
// router.delete("/:id", protect, authorizeRoles("F&B Admin"), deleteMenuItem);

export default router;