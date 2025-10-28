import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getKitchenOrders,
    getServedOrders
} from "../controllers/orderController.js";
// --- 1. IMPORT protect ---
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/kitchen', getKitchenOrders); // staff
router.get('/served', getServedOrders);

// --- 2. ADD 'protect' MIDDLEWARE ---
router.post("/", protect, createOrder); 
router.get("/", getOrders); // admin
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);

export default router;