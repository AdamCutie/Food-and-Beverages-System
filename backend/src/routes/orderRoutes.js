import express from "express";
import {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    getKitchenOrders
} from "../controllers/orderController.js";

const router = express.Router();


router.post("/", createOrder);
router.get("/", getOrders); // admin
router.get('/kitchen', getKitchenOrders); // staff
router.get("/:id", getOrderById);
router.put("/:id/status", updateOrderStatus);


export default router;