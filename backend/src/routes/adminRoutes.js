import express from "express";
import { 
    getAllStaff, 
    getAllCustomers,
    createStaff,
    updateStaff,
    deleteStaff
} from "../controllers/adminController.js";
import { 
    createMenuItem, 
    updateMenuItem, 
    deleteMenuItem 
} from "../controllers/itemController.js"; // <-- Import item management functions
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- Staff Management ---
router.get("/staff", protect, authorizeRoles("admin"), getAllStaff);
router.post("/staff", protect, authorizeRoles("admin"), createStaff);
router.put("/staff/:id", protect, authorizeRoles("admin"), updateStaff);
router.delete("/staff/:id", protect, authorizeRoles("admin"), deleteStaff);

// --- Customer Management ---
router.get("/customers", protect, authorizeRoles("admin"), getAllCustomers);

// --- Menu Item Management --- (FIX: Added these routes)
router.post("/items", protect, authorizeRoles("admin"), createMenuItem);
router.put("/items/:id", protect, authorizeRoles("admin"), updateMenuItem);
router.delete("/items/:id", protect, authorizeRoles("admin"), deleteMenuItem);

export default router;