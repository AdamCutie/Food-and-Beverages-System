import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import db from "../config/mysql.js";

const router = express.Router();

// Everyone can view menu
router.get("/", protect, (req, res) => {
  db.query("SELECT * FROM menu_items", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
});

// Only admin can add new menu item
router.post("/", protect, authorizeRoles("admin"), (req, res) => {
  const { name, description, price, stock, category } = req.body;

  const sql =
    "INSERT INTO menu_items (name, description, price, stock, category) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [name, description, price, stock, category], (err, result) => {
    if (err) return res.status(500).json({ message: "Insert failed", error: err });
    res.status(201).json({ message: "Menu item added", id: result.insertId });
  });
});

export default router;