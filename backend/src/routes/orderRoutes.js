import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getKitchenOrders,
    getServedOrders
} from "../controllers/orderController.js";

const router = express.Router();

router.get('/kitchen', getKitchenOrders); // staff
router.get('/served', getServedOrders);

router.post("/", createOrder);
router.get("/", getOrders); // admin
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);



export default router;