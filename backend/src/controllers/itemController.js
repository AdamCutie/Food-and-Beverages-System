import pool from "../config/mysql.js";

// @desc    Get all menu items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        const [items] = await pool.query("SELECT item_id, item_name, category, price, image_url, description FROM menu_items");
        
        const itemIds = items.map(item => item.item_id);
        if (itemIds.length > 0) {
            const [recipes] = await pool.query(
                `SELECT mi.menu_item_id, i.ingredient_id, i.name, mi.quantity_consumed, i.unit_of_measurement
                 FROM menu_item_ingredients mi
                 JOIN ingredients i ON mi.ingredient_id = i.ingredient_id
                 WHERE mi.menu_item_id IN (?)`,
                [itemIds]
            );

            items.forEach(item => {
                item.ingredients = recipes.filter(r => r.menu_item_id === item.item_id);
            });
        }
        
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
        const [items] = await pool.query("SELECT item_id, item_name, category, price, image_url, description FROM menu_items WHERE item_id = ?", [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        const item = items[0];

        const [recipes] = await pool.query(
            `SELECT mi.menu_item_id, i.ingredient_id, i.name, mi.quantity_consumed, i.unit_of_measurement
             FROM menu_item_ingredients mi
             JOIN ingredients i ON mi.ingredient_id = i.ingredient_id
             WHERE mi.menu_item_id = ?`,
            [id]
        );
        item.ingredients = recipes;

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu item", error: error.message });
    }
};

// @desc    Create a new menu item
// @route   POST /api/admin/items
// @access  Admin
export const createMenuItem = async (req, res) => {
    const { item_name, category, price, image_url, description, ingredients } = req.body; 

    if (!item_name || !category || !price || !description) { 
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: 'A menu item must have at least one ingredient.' });
    }

    const connection = await pool.getConnection(); 
    
    try {
        await connection.beginTransaction();

        const sql = "INSERT INTO menu_items (item_name, category, price, image_url, description) VALUES (?, ?, ?, ?, ?)";
        const [result] = await connection.query(sql, [item_name, category, price, image_url, description]);
        const newItemId = result.insertId;

        const recipeSql = "INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity_consumed) VALUES ?";
        const recipeValues = ingredients.map(ing => [newItemId, ing.ingredient_id, ing.quantity_consumed]);
        await connection.query(recipeSql, [recipeValues]);
        
        await connection.commit(); 

        const [newItem] = await pool.query("SELECT * FROM menu_items WHERE item_id = ?", [newItemId]);
        res.status(201).json(newItem[0]);

    } catch (error) {
        await connection.rollback(); 
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Failed to create menu item", error: error.message });
    } finally {
        connection.release(); 
    }
};

// @desc    Update a menu item
// @route   PUT /api/admin/items/:id
// @access  Admin
export const updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { item_name, category, price, image_url, description, ingredients } = req.body;

    if (!item_name || !category || !price) { 
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
        return res.status(400).json({ message: 'A menu item must have at least one ingredient.' });
    }

    const connection = await pool.getConnection(); 

    try {
        await connection.beginTransaction();

        const sql = `
            UPDATE menu_items 
            SET item_name = ?, category = ?, price = ?, image_url = ?, description = ? 
            WHERE item_id = ?
        `;
        const [result] = await connection.query(sql, [item_name, category, price, image_url, description, id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Item not found' });
        }

        await connection.query("DELETE FROM menu_item_ingredients WHERE menu_item_id = ?", [id]);

        const recipeSql = "INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity_consumed) VALUES ?";
        const recipeValues = ingredients.map(ing => [id, ing.ingredient_id, ing.quantity_consumed]);
        await connection.query(recipeSql, [recipeValues]);

        await connection.commit(); 

        const [updatedItem] = await pool.query("SELECT * FROM menu_items WHERE item_id = ?", [id]);
        res.status(200).json(updatedItem[0]);

    } catch (error) {
        await connection.rollback(); 
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Failed to update menu item", error: error.message });
    } finally {
        connection.release(); 
    }
};

// @desc    Delete a menu item
// @route   DELETE /api/admin/items/:id
// @access  Admin
export const deleteMenuItem = async (req, res) => {
  const { id } = req.params; 
  try {
    const sql = "DELETE FROM menu_items WHERE item_id = ?";
    const [result] = await pool.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Failed to delete menu item", error: error.message });
  }
};


// --- HELPER FUNCTIONS FOR STOCK MANAGEMENT ---

/**
 * @desc Validates if there is enough stock for a list of items.
 * @param {Array} items - Array of objects with item_id and quantity (from cart).
 * @param {Object} connection - A database connection from a transaction.
 */
export const validateStock = async (items, connection) => {
    for (const item of items) {
        const [recipe] = await connection.query(
            "SELECT i.name, i.stock_level, mi.quantity_consumed FROM menu_item_ingredients mi JOIN ingredients i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_item_id = ?",
            [item.item_id]
        );

        if (recipe.length === 0) {
            const [menuItem] = await connection.query("SELECT item_name FROM menu_items WHERE item_id = ?", [item.item_id]);
            throw new Error(`Menu item '${menuItem[0].item_name}' (ID ${item.item_id}) has no ingredient recipe defined.`);
        }

        for (const ing of recipe) {
            const requiredStock = ing.quantity_consumed * item.quantity;
            if (ing.stock_level < requiredStock) {
                throw new Error(`Not enough stock for ingredient '${ing.name}'. Available: ${ing.stock_level}, Requested: ${requiredStock}`);
            }
        }
    }
};

/**
 * @desc Adjusts the stock for a list of items (deducts or restores).
 * @param {Array} items - Array of objects with item_id and quantity (from cart).
 * @param {string} operation - Either 'deduct' or 'restore'.
 * @param {Object} connection - A database connection from a transaction.
 */
export const adjustStock = async (items, operation, connection) => {
    const operator = operation === 'deduct' ? '-' : '+';
    
    for (const item of items) {
        const [recipe] = await connection.query(
            "SELECT ingredient_id, quantity_consumed FROM menu_item_ingredients WHERE menu_item_id = ?",
            [item.item_id]
        );

        for (const ing of recipe) {
            const stockChange = ing.quantity_consumed * item.quantity;
            const stockSql = `UPDATE ingredients SET stock_level = stock_level ${operator} ? WHERE ingredient_id = ?`;
            await connection.query(stockSql, [stockChange, ing.ingredient_id]);
        }
    }
};

// --- ⭐️ NEW HELPER FUNCTION FOR ORDER LOGGING ⭐️ ---
/**
 * @desc Logs an inventory change related to an order
 * @param {number} order_id - The ID of the order causing the change
 * @param {Array} items - Array of objects with item_id and quantity
 * @param {string} action_type - 'ORDER_DEDUCT' or 'ORDER_RESTORE'
 * @param {Object} connection - A database connection from a transaction
 */
export const logOrderStockChange = async (order_id, items, action_type, connection) => {
  try {
    for (const item of items) {
      // 1. Get the recipe
      const [recipe] = await connection.query(
        "SELECT ingredient_id, quantity_consumed FROM menu_item_ingredients WHERE menu_item_id = ?",
        [item.item_id]
      );

      for (const ing of recipe) {
        const quantity_change = ing.quantity_consumed * item.quantity;
        
        // 2. Get the new stock level (AFTER the change was made)
        const [stockRows] = await connection.query(
          "SELECT stock_level FROM ingredients WHERE ingredient_id = ?",
          [ing.ingredient_id]
        );
        const new_stock_level = stockRows[0].stock_level;

        // 3. Create the log
        const logSql = "INSERT INTO inventory_logs (ingredient_id, staff_id, action_type, quantity_change, new_stock_level, reason) VALUES (?, ?, ?, ?, ?, ?)";
        const reason = `Order ID: ${order_id}`;
        // We pass NULL for staff_id because this is a system (customer) action
        await connection.query(logSql, [ing.ingredient_id, null, action_type, quantity_change, new_stock_level, reason]);
      }
    }
  } catch (error) {
    // Log the error but don't stop the transaction (logging is secondary)
    console.error('Failed to log order stock change:', error.message);
  }
};