import pool from "../config/mysql.js";
import bcrypt from "bcryptjs";


// @desc    Get all customers
// @route   GET /api/admin/customers
// @access  Admin
export const getAllCustomers = async (req, res) => {
    try {
        // UPDATED: Query from 'tbl_client_users' instead of 'customers'
        const sql = `
            SELECT 
                client_id, 
                first_name, 
                last_name, 
                email, 
                phone, 
                created_at 
            FROM tbl_client_users
        `;
        const [customers] = await pool.query(sql);
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: "Error fetching customer list", error: error.message });
    }
};