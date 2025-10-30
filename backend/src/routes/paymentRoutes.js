import express from "express";
import bodyParser from "body-parser";
import {
  recordPayment,
  getPaymentsForOrder,
  simulatePayment,
  createPaymongoCheckout,
  handlePaymongoWebhook,
} from "../controllers/paymentController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------
   🔒 Protected Routes
-------------------------- */

// 1️⃣ Simulate Payment (for testing)
router.put("/:order_id/simulate", protect, simulatePayment);

// 2️⃣ Manual Record (Cashier/Admin use)
router.post("/", protect, authorizeRoles("cashier", "admin"), recordPayment);

// 3️⃣ Get Payments for an Order
router.get("/:order_id", protect, authorizeRoles("cashier", "admin"), getPaymentsForOrder);

/* -------------------------
   💳 PayMongo Routes
-------------------------- */

// 4️⃣ Create PayMongo Checkout Session
router.post("/:order_id/paymongo", protect, createPaymongoCheckout);

// 5️⃣ Webhook (PayMongo calls this directly — no auth, must use raw body)
router.post("/webhook", bodyParser.raw({ type: "application/json" }), handlePaymongoWebhook);

export default router;
