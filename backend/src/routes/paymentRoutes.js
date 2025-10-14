import express from "express";
import { recordPayment, getPaymentsForOrder } from "../controllers/paymentController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRoles('cashier', 'admin'), recordPayment);
router.get("/:order_id", protect, authorizeRoles('cashier', 'admin'), getPaymentsForOrder);

export default router;