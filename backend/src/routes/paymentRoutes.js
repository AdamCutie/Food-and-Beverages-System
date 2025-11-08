import express from "express";
import bodyParser from "body-parser";
import {
  createPayMongoPayment,
  paymongoWebhook,
  recordPayment,
  getPaymentsForOrder,
} from "../controllers/paymentController.js";

import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

/* -------------------------
   🔒 Protected Routes
-------------------------- */
// Customer create Payment
router.post('/:order_id/paymongo', protect, authorizeRoles("customer"), createPayMongoPayment);

// 2️⃣ Manual Record (Cashier/Admin use)
router.post("/", protect, authorizeRoles("cashier", "admin"), recordPayment);

// 3️⃣ Get Payments for an Order
router.get("/:order_id", protect, authorizeRoles("cashier", "admin"), getPaymentsForOrder);

/* -------------------------
   💳 PayMongo Routes
-------------------------- */


// 5️⃣ Webhook (PayMongo calls this directly — no auth, must use raw body)
router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  paymongoWebhook
);

export default router;