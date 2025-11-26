import express from "express";
import { getAllCustomers } from "../controllers/adminController.js";
import { 
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem 
} from "../controllers/itemController.js"; 
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
// --- Customer Management ---
// UPDATED: Allow 'F&B Admin' to view customers
router.get("/customers", protect, authorizeRoles("F&B Admin"), getAllCustomers);

// --- Menu Item Management (Admin Actions) --- 
// UPDATED: Allow 'F&B Admin' to manage menu
router.post("/items", protect, authorizeRoles("F&B Admin"), createMenuItem);
router.put("/items/:id", protect, authorizeRoles("F&B Admin"), updateMenuItem);
router.delete("/items/:id", protect, authorizeRoles("F&B Admin"), deleteMenuItem);

export default router;