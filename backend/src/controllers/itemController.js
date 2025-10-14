import pool from "../config/mysql.js";

// @desc    Get all available menu items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        const [items] = await pool.query("SELECT * FROM menu_items WHERE availability = TRUE");
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu items", error: error.message });
    }
};

// @desc    Get a single menu item by ID
// @route   GET /api/items/:id
// @access  Public
export const getItemById = async (req, res) => {
    try {
        const { id } = req.params;
        const [item] = await pool.query("SELECT * FROM menu_items WHERE item_id = ?", [id]);
        if (item.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.json(item[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu item", error: error.message });
    }
}

// @desc    Create a new menu item
// @route   POST /api/admin/items
// @access  Admin
export const createMenuItem = async (req, res) => {
    try {
        const { item_name, category, price, availability } = req.body;
        if (!item_name || !price) {
            return res.status(400).json({ message: "Item name and price are required" });
        }

        const sql = "INSERT INTO menu_items (item_name, category, price, availability) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(sql, [item_name, category, price, availability === false ? false : true]);

        res.status(201).json({
            item_id: result.insertId,
            message: "Menu item created successfully"
        });
    } catch (error) {
        res.status(500).json({ message: "Error creating menu item", error: error.message });
    }
};

// @desc    Update a menu item
// @route   PUT /api/admin/items/:id
// @access  Admin
export const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, category, price, availability } = req.body;

        const sql = "UPDATE menu_items SET item_name = ?, category = ?, price = ?, availability = ? WHERE item_id = ?";
        const [result] = await pool.query(sql, [item_name, category, price, availability, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        res.json({ message: "Menu item updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating menu item", error: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/admin/items/:id
// @access  Admin
export const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM menu_items WHERE item_id = ?", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting menu item", error: error.message });
    }
};