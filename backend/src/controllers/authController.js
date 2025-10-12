import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/mysql.js";

// REGISTER USER (Admin or Customer)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    db.query("SELECT * FROM customers WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });
      if (results.length > 0)
        return res.status(400).json({ message: "User already exists" });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // ✅ Declare userRole before using it
      const userRole =
        role && ["admin", "staff", "customer"].includes(role) ? role : "customer";

      const sql =
        "INSERT INTO customers (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)";
      db.query(sql, [name, email, hashedPassword, phone || null, userRole], (err2, result) => {
        if (err2) return res.status(500).json({ message: "Insert failed", error: err2 });

        res.status(201).json({
          id: result.insertId,
          name,
          email,
          role: userRole,
          message: "User registered successfully",
        });
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN USERS
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    db.query("SELECT * FROM customers WHERE email = ?", [email], async (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err });
      if (results.length === 0)
        return res.status(401).json({ message: "Invalid email or password" });

      const user = results[0];
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: "Invalid password" });

      const token = jwt.sign(
        { id: user.customer_id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.customer_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      });
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
