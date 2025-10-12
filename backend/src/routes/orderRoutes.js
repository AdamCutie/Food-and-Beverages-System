import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import db from "../config/mysql.js";

const router = express.Router();

// Example: Get all orders for the logged-in user
router.get("/", protect, (req, res) => {
  const sql = "SELECT * FROM orders WHERE customer_id = ?";
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
});

// Example: Place a new order
router.post("/", protect, (req, res) => {
  const { total_amount, status } = req.body;
  const sql = "INSERT INTO orders (customer_id, total_amount, status) VALUES (?, ?, ?)";
  db.query(sql, [req.user.id, total_amount, status || "Pending"], (err, result) => {
    if (err) return res.status(500).json({ message: "Order creation failed", error: err });
    res.status(201).json({ message: "Order placed", order_id: result.insertId });
  });
});

export default router;
