import express from "express";
import { 
    getAllEmployees, 
    getAllCustomers,
    createEmployee,
    updateEmployee,
    deleteEmployee
} from "../controllers/adminController.js";
import { 
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem 
} from "../controllers/itemController.js"; // <-- Import item management functions
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Staff Management ---
router.get("/staff", protect, authorizeRoles("admin", "employee"), getAllEmployees);
router.post("/staff", protect, authorizeRoles("admin", "employee"), createEmployee);
router.put("/staff/:id", protect, authorizeRoles("admin", "employee"), updateEmployee);
router.delete("/staff/:id", protect, authorizeRoles("admin", "employee"), deleteEmployee);

// --- Customer Management ---
router.get("/customers", protect, authorizeRoles("admin", "employee"), getAllCustomers);

// --- Menu Item Management --- 
router.post("/items", protect, authorizeRoles("admin", "employee"), createMenuItem);
router.put("/items/:id", protect, authorizeRoles("admin", "employee"), updateMenuItem);
router.delete("/items/:id", protect, authorizeRoles("admin", "employee"), deleteMenuItem);

export default router;