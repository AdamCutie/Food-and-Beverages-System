import express from "express";
import { 
    getAllEmployees, 
    getAllCustomers,
    createEmployee,
    updateEmployee,
    deleteEmployee
} from "../controllers/adminController.js";
import { 
    // Note: These item functions might be moved to itemController, 
    // but if you are importing them here, ensure they exist or import from itemController
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem 
} from "../controllers/itemController.js"; 
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Staff Management ---
// UPDATED: Allow 'F&B Admin' to manage staff
router.get("/staff", protect, authorizeRoles("F&B Admin"), getAllEmployees);
router.post("/staff", protect, authorizeRoles("F&B Admin"), createEmployee);
router.put("/staff/:id", protect, authorizeRoles("F&B Admin"), updateEmployee);
router.delete("/staff/:id", protect, authorizeRoles("F&B Admin"), deleteEmployee);

// --- Customer Management ---
// UPDATED: Allow 'F&B Admin' to view customers
router.get("/customers", protect, authorizeRoles("F&B Admin"), getAllCustomers);

// --- Menu Item Management (Admin Actions) --- 
// UPDATED: Allow 'F&B Admin' to manage menu
router.post("/items", protect, authorizeRoles("F&B Admin"), createMenuItem);
router.put("/items/:id", protect, authorizeRoles("F&B Admin"), updateMenuItem);
router.delete("/items/:id", protect, authorizeRoles("F&B Admin"), deleteMenuItem);

export default router;