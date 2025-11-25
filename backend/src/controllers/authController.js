import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/mysql.js";

// @desc    Register a new user (customer or staff)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { 
      first_name, 
      middle_name,
      last_name, 
      email, 
      password, 
      phone, 
      role = "customer", 
      nationality = "Filipino",
      username // For staff registration
    } = req.body;

    // Validate essential fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!first_name || !last_name) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === "customer") {
      // Check if customer with this email already exists
      const [existing] = await pool.query(
        "SELECT * FROM tbl_client_users WHERE email = ?", 
        [email]
      );
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "Customer with this email already exists" });
      }

      // Insert new customer
      const sql = `
        INSERT INTO tbl_client_users 
        (first_name, middle_name, last_name, email, password, nationality, phone) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await pool.query(sql, [
        first_name, 
        middle_name || null,
        last_name, 
        email, 
        hashedPassword, 
        nationality, 
        phone || null
      ]);
      
      return res.status(201).json({ 
        customer_id: result.insertId, 
        message: "Customer registered successfully" 
      });

    } else if (["superadmin", "admin", "supervisor", "employee"].includes(role)) {
      // For staff registration, username is required
      if (!username) {
        return res.status(400).json({ message: "Username is required for staff registration" });
      }

      // Check if staff with this username already exists
      const [existingUsername] = await pool.query(
        "SELECT * FROM users WHERE username = ?", 
        [username]
      );
      
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: "Staff member with this username already exists" });
      }

      // Check if staff with this email already exists
      const [existingEmail] = await pool.query(
        "SELECT * FROM employee_emails WHERE email = ?", 
        [email]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: "Staff member with this email already exists" });
      }

      // Start transaction for creating user, employee, and email
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();

        // 1. Insert into users (authentication)
        const [userResult] = await connection.query(
          "INSERT INTO users (username, password, role, created_by) VALUES (?, ?, ?, ?)",
          [username, hashedPassword, role, 1] // created_by = 1 (superadmin)
        );
        
        const userId = userResult.insertId;

        // 2. Insert into employees (profile)
        const [employeeResult] = await connection.query(
          `INSERT INTO employees 
          (user_id, first_name, middle_name, last_name, created_by) 
          VALUES (?, ?, ?, ?, ?)`,
          [userId, first_name, middle_name || null, last_name, 1]
        );

        const employeeId = employeeResult.insertId;

        // 3. Insert into employee_emails
        await connection.query(
          "INSERT INTO employee_emails (employee_id, email, created_by) VALUES (?, ?, ?)",
          [employeeId, email, 1]
        );

        await connection.commit();
        
        return res.status(201).json({ 
          employee_id: employeeId,
          user_id: userId,
          message: "Staff member registered successfully" 
        });

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    let user = null;
    let userType = null;
    let userId = null;
    let payload = {}; 

    // =========================================================
    // 1. CHECK CLIENTS (Updated to use tbl_client_users)
    // =========================================================
    // We now check 'tbl_client_users' instead of 'customers'
    const [client] = await pool.query(
      "SELECT client_id, first_name, last_name, email, password FROM tbl_client_users WHERE email = ?", 
      [email]
    );

    if (client.length > 0) {
      user = client[0];
      userType = "customer";
      userId = user.client_id; // Note: ID column is client_id
      
      payload = { 
        id: userId, 
        role: userType, 
        firstName: user.first_name, 
        lastName: user.last_name 
      };

      // Verify Password
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });
        return res.json({ token, user: payload });
      }
    } 

    // =========================================================
    // 2. CHECK HRIS EMPLOYEES (Connected to Main System)
    // =========================================================
    // This replaces the old 'staff' table check
    const hrisSql = `
      SELECT 
        u.user_id, 
        u.password, 
        u.role, 
        e.first_name, 
        e.last_name,
        p.position_name
      FROM employee_emails ee
      JOIN employees e ON ee.employee_id = e.employee_id
      JOIN users u ON e.user_id = u.user_id
      LEFT JOIN job_positions p ON e.position_id = p.position_id
      WHERE ee.email = ?
    `;
    
    const [hrisUser] = await pool.query(hrisSql, [email]);

    if (hrisUser.length > 0) {
      user = hrisUser[0];
      userId = user.user_id;
      
      // Map HRIS roles (superadmin -> admin)
      userType = user.role === 'superadmin' ? 'admin' : user.role;

      payload = { 
        id: userId, 
        role: userType, 
        firstName: user.first_name, 
        lastName: user.last_name,
        position: user.position_name ? user.position_name.trim() : null // Add Position to Token (trimmed)
      };

      // Verify HRIS Password
      if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "2h" });
        return res.json({ token, user: payload });
      }
    }

    // If we reach here, no user was found in either table
    return res.status(401).json({ message: "Invalid credentials: User not found or password incorrect" });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login", error: error.message });
  }
};

// @desc    Get current user info
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "customer") {
      const [customer] = await pool.query(
        `SELECT client_id, first_name, middle_name, last_name, email, phone, nationality, created_at
         FROM tbl_client_users 
         WHERE client_id = ? AND is_archived = 0`,
        [userId]
      );

      if (customer.length === 0) {
        return res.status(404).json({ message: "Customer not found" });
      }

      return res.json({ user: customer[0] });

    } else {
      const [staff] = await pool.query(
        `SELECT 
          e.employee_id,
          e.employee_code,
          e.first_name,
          e.middle_name,
          e.last_name,
          e.department_id,
          e.position_id,
          u.username,
          u.role,
          ee.email,
          d.department_name,
          p.position_name
         FROM employees e
         INNER JOIN users u ON e.user_id = u.user_id
         LEFT JOIN employee_emails ee ON e.employee_id = ee.employee_id
         LEFT JOIN departments d ON e.department_id = d.department_id
         LEFT JOIN job_positions p ON e.position_id = p.position_id
         WHERE e.employee_id = ? AND e.status = 'active'`,
        [userId]
      );

      if (staff.length === 0) {
        return res.status(404).json({ message: "Staff member not found" });
      }

      return res.json({ user: staff[0] });
    }
    
  } catch (error) {
    console.error("Get Current User Error:", error);
    res.status(500).json({ 
      message: "Server error fetching user data", 
      error: error.message 
    });
  }
};