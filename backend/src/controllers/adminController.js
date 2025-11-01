import pool from "../config/mysql.js";
import bcrypt from "bcryptjs";

// @desc    Get all staff
// @route   GET /api/admin/staff
// @access  Admin
export const getAllStaff = async (req, res) => {
    try {
        // --- FIX: Select first_name, last_name ---
        const [staff] = await pool.query("SELECT staff_id, first_name, last_name, email, role, shift_schedule FROM staff");
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: "Error fetching staff list", error: error.message });
    }
};

// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Admin
export const getAllCustomers = async (req, res) => {
    try {
        // --- THIS IS THE FIX ---
        // Changed "full_name" to "first_name, last_name"
        const [customers] = await pool.query("SELECT customer_id, first_name, last_name, email, phone, created_at FROM customers");
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching customer list", error: error.message });
    }
};

// @desc    Create a new staff member
// @route   POST /api/admin/staff
// @access  Admin
export const createStaff = async (req, res) => {
    try {
        // --- FIX: Read first_name, last_name ---
        const { first_name, last_name, email, password, role, shift_schedule } = req.body;

        // --- FIX: Update validation ---
        if (!first_name || !last_name || !email || !password || !role) {
            return res.status(400).json({ message: "First name, last name, email, password, and role are required." });
        }

        const [existingStaff] = await pool.query("SELECT * FROM staff WHERE email = ?", [email]);
        if (existingStaff.length > 0) {
            return res.status(400).json({ message: "A staff member with this email already exists." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // --- FIX: Update SQL query ---
        const sql = "INSERT INTO staff (first_name, last_name, email, password, role, shift_schedule) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(sql, [first_name, last_name, email, hashedPassword, role, shift_schedule || null]);

        res.status(201).json({
            staff_id: result.insertId,
            message: "Staff member created successfully."
        });

    } catch (error) {
        res.status(500).json({ message: "Error creating staff member", error: error.message });
    }
};

// @desc    Update a staff member
// @route   PUT /api/admin/staff/:id
// @access  Admin
export const updateStaff = async (req, res) => {
    try {
        const { id } = req.params;
        // --- FIX: Read first_name, last_name ---
        const { first_name, last_name, email, role, shift_schedule } = req.body;

        // --- FIX: Update validation ---
        if (!first_name || !last_name || !email || !role) {
            return res.status(400).json({ message: "First name, last name, email, and role are required." });
        }

        // --- FIX: Update SQL query ---
        const sql = "UPDATE staff SET first_name = ?, last_name = ?, email = ?, role = ?, shift_schedule = ? WHERE staff_id = ?";
        const [result] = await pool.query(sql, [first_name, last_name, email, role, shift_schedule, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        res.json({ message: "Staff member updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error updating staff member", error: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/admin/staff/:id
// @access  Admin
export const deleteStaff = async (req, res) => {
    try {
        const { id } = req.params;
        
        // You might want to add checks here to prevent deletion of orders/data associated with the staff member
        const [result] = await pool.query("DELETE FROM staff WHERE staff_id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        res.json({ message: "Staff member deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Error deleting staff member", error: error.message });
    }
};