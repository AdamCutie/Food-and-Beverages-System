import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/mysql.js";

// @desc    Register a new user (customer or staff)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    // --- FIX: Read first_name and last_name ---
    const { first_name, last_name, email, password, phone, role = "customer" } = req.body;

    // Validate essential fields
    // --- FIX: Validate new fields ---
    if (!first_name || !last_name || !email || !password) {
      return res
        .status(400)
        .json({ message: "First name, last name, email, and password are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === "customer") {
      // Check if a customer with this email already exists
      const [existing] = await pool.query("SELECT * FROM customers WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }

      // Insert new customer into the database
      // --- FIX: Use correct columns in SQL query ---
      const sql = "INSERT INTO customers (first_name, last_name, email, password, phone) VALUES (?, ?, ?, ?, ?)";
      // --- FIX: Pass new fields to query ---
      const [result] = await pool.query(sql, [first_name, last_name, email, hashedPassword, phone || null]);
      
      return res.status(201).json({ customer_id: result.insertId, message: "Customer registered successfully" });

    } else if (["admin", "waiter", "cashier"].includes(role)) {
      // Check if a staff member with this email already exists
      const [existing] = await pool.query("SELECT * FROM staff WHERE email = ?", [email]);
      if (existing.length > 0) {
        return res.status(400).json({ message: "Staff member with this email already exists" });
      }

      // NOTE: The staff table *does* use full_name.
      // We must check for 'full_name' for staff roles.
      if (!req.body.full_name) {
         return res.status(400).json({ message: "Staff registration requires 'full_name'" });
      }

      // Insert new staff member into the database
      const sql = "INSERT INTO staff (full_name, email, password, role) VALUES (?, ?, ?, ?)";
      const [result] = await pool.query(sql, [req.body.full_name, email, hashedPassword, role]);
      
      return res.status(201).json({ staff_id: result.insertId, message: "Staff member registered successfully" });

    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    // Standardized login using email and password for all roles
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = null;
    let userType = null;
    let userId = null;

    // First, check if the email belongs to a customer
    const [customer] = await pool.query("SELECT * FROM customers WHERE email = ?", [email]);
    if (customer.length > 0) {
      user = customer[0];
      userType = "customer";
      userId = user.customer_id;
    } else {
      // If not a customer, check if the email belongs to a staff member
      const [staff] = await pool.query("SELECT * FROM staff WHERE email = ?", [email]);
      if (staff.length > 0) {
        user = staff[0];
        userType = user.role; // This will be 'admin', 'waiter', or 'cashier'
        userId = user.staff_id;
      }
    }

    // Verify user was found and password is correct
    if (user && (await bcrypt.compare(password, user.password))) {
      // Create and sign a JWT
      const token = jwt.sign(
        { id: userId, role: userType },
        process.env.JWT_SECRET,
        { expiresIn: "2h" } // Token expires in 2 hour
      );
      
      return res.json({ token });
    } else {
      // If user not found or password incorrect, send a generic error message
      return res.status(401).json({ message: "Invalid credentials: User not found or password incorrect" });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};
