import express from "express";
import {
    recordPayment,          
    getPaymentsForOrder,    
    simulatePayment         
} from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- 1. ADD 'protect' MIDDLEWARE ---
// (We don't need authorizeRoles, just 'protect' to ensure it's a logged-in user)
router.put("/:order_id/simulate", protect, simulatePayment);

// --- Keep Existing Routes (for Cashier/Admin) ---
router.post("/", protect, authorizeRoles('cashier', 'admin'), recordPayment); 
router.get("/:order_id", protect, authorizeRoles('cashier', 'admin'), getPaymentsForOrder);

export default router;