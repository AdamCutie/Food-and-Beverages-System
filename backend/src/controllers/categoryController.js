import pool from "../config/mysql.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getAllCategories = async (req, res) => {
    try {
        const [categories] = await pool.query("SELECT * FROM fb_categories ORDER BY category_id ASC");
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error fetching categories", error: error.message });
    }
};