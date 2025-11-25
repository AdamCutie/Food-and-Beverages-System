import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getKitchenOrders,
    getServedOrders,
    createPosOrder
} from "../controllers/orderController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// --- 1. Kitchen Display Routes ---
// Allowed: F&B Admin, Kitchen Staffs, Waiter, Cashier
router.get(
    '/kitchen', 
    protect, 
    authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), 
    getKitchenOrders
); 

router.get(
    '/served', 
    protect, 
    authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), 
    getServedOrders
);

// --- 2. POS Order Creation ---
// Allowed: F&B Admin, Waiter, Cashier
router.post(
    "/pos", 
    protect, 
    authorizeRoles("F&B Admin", "Waiter", "Cashier"), 
    createPosOrder
);

// --- 3. Order Status Updates (Kitchen/POS) ---
// Allowed: F&B Admin, Kitchen Staffs, Waiter, Cashier
router.put(
    "/:id/status", 
    protect, 
    authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), 
    updateOrderStatus
);

// --- 4. Admin/Customer Routes ---
router.post("/", protect, createOrder); // Customer creates own order (checked by role=customer internally or logic)
router.get("/", getOrders); // Usually Admin only, or filtering in controller
router.get("/:id", getOrderById); // Public/Protected mixed logic in controller

export default router;