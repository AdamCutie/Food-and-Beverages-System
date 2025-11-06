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

// --- 1. ADD 'protect' and 'authorizeRoles' TO THESE ROUTES ---
router.get(
    '/kitchen', 
    protect, 
    authorizeRoles("admin", "waiter", "cashier"), 
    getKitchenOrders
); 
router.get(
    '/served', 
    protect, 
    authorizeRoles("admin", "waiter", "cashier"), 
    getServedOrders
);

router.post(
    "/pos", 
    protect, 
    authorizeRoles("admin", "waiter", "cashier"), 
    createPosOrder
);

router.post("/", protect, createOrder); 
router.get("/", getOrders); // admin
router.get("/:id", getOrderById);

// --- 2. ADD 'protect' and 'authorizeRoles' TO THIS ROUTE ---
router.put(
    "/:id/status", 
    protect, 
    authorizeRoles("admin", "waiter", "cashier"), 
    updateOrderStatus
);
// --- END OF CHANGE ---

export default router;