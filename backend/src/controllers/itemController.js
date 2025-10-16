import pool from "../config/mysql.js";

// @desc    Get all menu items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        const [items] = await pool.query("SELECT item_id, item_name, category, price, stock FROM menu_items");
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
        const [items] = await pool.query("SELECT item_id, item_name, category, price, stock FROM menu_items WHERE item_id = ?", [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.json(items[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu item", error: error.message });
    }
};

// @desc    Create a new menu item
// @route   POST /api/admin/items
// @access  Admin
export const createMenuItem = async (req, res) => {
    try {
        const { item_name, category, price, stock } = req.body;
        if (!item_name || !price) {
            return res.status(400).json({ message: "Item name and price are required" });
        }

        const sql = "INSERT INTO menu_items (item_name, category, price, stock) VALUES (?, ?, ?, ?)";
        const [result] = await pool.query(sql, [item_name, category, price, stock || 0]);

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
        const { item_name, category, price, stock } = req.body;
        if (!item_name || !price) {
            return res.status(400).json({ message: "Item name and price are required" });
        }
        const sql = "UPDATE menu_items SET item_name = ?, category = ?, price = ?, stock = ? WHERE item_id = ?";
        const [result] = await pool.query(sql, [item_name, category, price, stock, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.json({ message: "Menu item updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error updating item", error: error.message });
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
        res.status(500).json({ message: "Server error deleting item", error: error.message });
    }
};

// --- NEW HELPER FUNCTIONS FOR STOCK MANAGEMENT ---

/**
 * @desc Validates if there is enough stock for a list of items.
 * @param {Array} items - Array of objects with item_id and quantity.
 * @param {Object} connection - A database connection from a transaction.
 */
export const validateStock = async (items, connection) => {
    for (const item of items) {
        const [rows] = await connection.query("SELECT stock, item_name FROM menu_items WHERE item_id = ?", [item.item_id]);
        if (rows.length === 0) {
            throw new Error(`Item with ID ${item.item_id} not found.`);
        }
        if (rows[0].stock < item.quantity) {
            throw new Error(`Not enough stock for ${rows[0].item_name}. Available: ${rows[0].stock}, Requested: ${item.quantity}`);
        }
    }
};

/**
 * @desc Adjusts the stock for a list of items (deducts or restores).
 * @param {Array} items - Array of objects with item_id and quantity.
 * @param {string} operation - Either 'deduct' or 'restore'.
 * @param {Object} connection - A database connection from a transaction.
 */
export const adjustStock = async (items, operation, connection) => {
    const operator = operation === 'deduct' ? '-' : '+';
    for (const item of items) {
        const stockSql = `UPDATE menu_items SET stock = stock ${operator} ? WHERE item_id = ?`;
        await connection.query(stockSql, [item.quantity, item.item_id]);
    }
};