import pool from "../config/mysql.js";

// @desc    Get all menu items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        // --- CHANGE: Add image_url to the SELECT statement ---
        const [items] = await pool.query("SELECT item_id, item_name, category, price, stock, image_url,description FROM menu_items");
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
        // --- CHANGE: Add image_url to the SELECT statement ---
        const [items] = await pool.query("SELECT item_id, item_name, category, price, stock, image_url, description FROM menu_items WHERE item_id = ?", [id]);
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
    // --- CHANGE: Add image_url to the destructuring ---
    const { item_name, category, price, stock, image_url, description} = req.body;

    if (!item_name || !category || !price || stock === undefined || !description) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        // --- CHANGE: Add image_url to the INSERT statement ---
        const sql = "INSERT INTO menu_items (item_name, category, price, stock, image_url, description) VALUES (?, ?, ?, ?, ?, ?)";
        const [result] = await pool.query(sql, [item_name, category, price, stock, image_url, description]);

        const newItemId = result.insertId;
        const [newItem] = await pool.query("SELECT * FROM menu_items WHERE item_id = ?", [newItemId]);

        res.status(201).json(newItem[0]);
    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Failed to create menu item", error: error.message });
    }
};

// @desc    Update a menu item
// @route   PUT /api/admin/items/:id
// @access  Admin
export const updateMenuItem = async (req, res) => {
    const { id } = req.params;
    // --- CHANGE: Add image_url to the destructuring ---
    const { item_name, category, price, stock, image_url,description } = req.body;

    if (!item_name || !category || !price || stock === undefined) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    try {
        // --- CHANGE: Add image_url to the UPDATE statement ---
        const sql = `
      UPDATE menu_items 
      SET item_name = ?, category = ?, price = ?, stock = ?, image_url = ?, description = ? 
      WHERE item_id = ?
    `;
        const [result] = await pool.query(sql, [item_name, category, price, stock, image_url,description, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const [updatedItem] = await pool.query("SELECT * FROM menu_items WHERE item_id = ?", [id]);
        res.status(200).json(updatedItem[0]);

    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Failed to update menu item", error: error.message });
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/admin/items/:id
// @access  Admin
export const deleteMenuItem = async (req, res) => {
  const { id } = req.params; // Get the item_id from the URL

  try {
    const sql = "DELETE FROM menu_items WHERE item_id = ?";
    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      // If no rows were deleted, the item was not found
      return res.status(404).json({ message: 'Item not found' });
    }

    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Failed to delete menu item", error: error.message });
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