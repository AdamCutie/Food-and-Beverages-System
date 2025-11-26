import express from "express";
import { 
    getAllTables, 
    updateTableStatus,
    createTable, 
    updateTable, 
    deleteTable  
} from "../controllers/tableController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Get Tables
router.get("/", getAllTables);

// Protected (Staff): Update Status (Occupied/Available)
router.put("/:id/status", protect, authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), updateTableStatus);

// Protected (Admin): CRUD Operations
router.post("/", protect, authorizeRoles("F&B Admin"), createTable);
router.put("/:id", protect, authorizeRoles("F&B Admin"), updateTable);
router.delete("/:id", protect, authorizeRoles("F&B Admin"), deleteTable);

export default router;