import pool from "../config/mysql.js";

// @desc    Get all menu items
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        // 1. Get all menu items with category
       const itemSql = `
        SELECT 
            mi.item_id, 
            mi.item_name, 
            c.name AS category, 
            mi.price, 
            mi.image_url, 
            mi.description,
            mi.category_id,
            mi.promotion_id,
            -- Check if promo is active and within date range
            CASE 
                WHEN p.promotion_id IS NOT NULL 
                     AND p.is_active = 1 
                     AND CURDATE() BETWEEN p.start_date AND p.end_date 
                THEN 1 
                ELSE 0 
            END AS is_promo,
            p.discount_percentage AS promo_discount_percentage,
            p.end_date AS promo_expiry_date,
            p.name AS promo_name
        FROM fb_menu_items mi
        LEFT JOIN fb_categories c ON mi.category_id = c.category_id
        LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
    `;
        const [items] = await pool.query(itemSql);
        
        if (items.length === 0) {
            return res.json([]);
        }

        // --- NEW LOGIC ---
        // 2. Get all recipes
        const itemIds = items.map(item => item.item_id);
        const [recipes] = await pool.query(
        `SELECT mi.menu_item_id, i.ingredient_id, mi.quantity_consumed
         FROM fb_menu_item_ingredients mi
         JOIN fb_ingredients i ON mi.ingredient_id = i.ingredient_id
         WHERE mi.menu_item_id IN (?)`,
        [itemIds]
        );

        // 3. Get all ingredient stock levels and put them in a Map for fast lookup
        const [ingredients] = await pool.query("SELECT ingredient_id, stock_level FROM fb_ingredients");
        const stockMap = new Map(ingredients.map(ing => [ing.ingredient_id, parseFloat(ing.stock_level)]));
        // --- END OF NEW LOGIC ---

        // 4. Combine items, recipes, and check stock
        items.forEach(item => {
            const itemRecipes = recipes.filter(r => r.menu_item_id === item.item_id);
            item.ingredients = itemRecipes; // Add recipe for reference
            
            // --- NEW AVAILABILITY CHECK ---
            item.is_available = true; // Assume it's available by default

            // If it has no recipe, it can't be sold
            if (itemRecipes.length === 0) {
                item.is_available = false;
            }

            for (const recipeItem of itemRecipes) {
                const availableStock = stockMap.get(recipeItem.ingredient_id) || 0;
                // If *any* ingredient is below the required amount, mark as unavailable
                if (availableStock < recipeItem.quantity_consumed) {
                    item.is_available = false;
                    break; // No need to check other ingredients
                }
            }
            // --- END OF NEW CHECK ---
        });
        
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
        const sql = `
            SELECT 
            mi.item_id, 
            mi.item_name, 
            c.name AS category, 
            mi.price, 
            mi.image_url, 
            mi.description,
            mi.category_id,
            CASE 
                WHEN p.promotion_id IS NOT NULL 
                     AND p.is_active = 1 
                     AND CURDATE() BETWEEN p.start_date AND p.end_date 
                THEN 1 
                ELSE 0 
            END AS is_promo,
            p.discount_percentage AS promo_discount_percentage,
            p.end_date AS promo_expiry_date,
            p.name AS promo_name
        FROM fb_menu_items mi
        LEFT JOIN fb_categories c ON mi.category_id = c.category_id
        LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
        WHERE mi.item_id = ?
    `;
        const [items] = await pool.query(sql, [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        const item = items[0];

        const [recipes] = await pool.query(
        `SELECT mi.menu_item_id, i.ingredient_id, i.name, mi.quantity_consumed, i.unit_of_measurement
         FROM fb_menu_item_ingredients mi
         JOIN fb_ingredients i ON mi.ingredient_id = i.ingredient_id
         WHERE mi.menu_item_id = ?`,
        [id]
        );
        item.ingredients = recipes;

        // --- NEW AVAILABILITY CHECK FOR SINGLE ITEM ---
        item.is_available = true;
        if (recipes.length === 0) {
            item.is_available = false;
        } else {
            for (const recipeItem of recipes) {
                const [stockRows] = await pool.query("SELECT stock_level FROM fb_ingredients WHERE ingredient_id = ?", [recipeItem.ingredient_id]);
                const availableStock = stockRows[0] ? parseFloat(stockRows[0].stock_level) : 0;
                if (availableStock < recipeItem.quantity_consumed) {
                    item.is_available = false;
                    break;
                }
            }
        }
        // --- END OF NEW CHECK ---

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu item", error: error.message });
    }
};

// @desc    Create a new menu item
// @route   POST /api/admin/items
// @access  Admin
export const createMenuItem = async (req, res) => {
    const { 
        item_name, category_id, price, image_url, description, ingredients 
        // REMOVED: is_promo, etc.
    } = req.body; 

    if (!item_name || !category_id || !price) { 
        return res.status(400).json({ message: 'Please provide item name, category, and price.' });
    }
    
    const connection = await pool.getConnection(); 
    
    try {
        await connection.beginTransaction();

        // UPDATED: Simplified insert, no promo creation
        const sql = `
            INSERT INTO fb_menu_items 
            (item_name, category_id, price, image_url, description, promotion_id) 
            VALUES (?, ?, ?, ?, ?, NULL)
        `;
        
        const [result] = await connection.query(sql, [
            item_name, category_id, price, image_url, description
        ]);
        const newItemId = result.insertId;

        // Insert Ingredients
        if (ingredients && ingredients.length > 0) {
            const recipeSql = "INSERT INTO fb_menu_item_ingredients (menu_item_id, ingredient_id, quantity_consumed) VALUES ?";
            const recipeValues = ingredients.map(ing => [newItemId, ing.ingredient_id, ing.quantity_consumed]);
            await connection.query(recipeSql, [recipeValues]);
        }
        
        await connection.commit(); 
        res.status(201).json({ message: "Item created successfully", item_id: newItemId });

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
    const { 
        item_name, category_id, price, image_url, description, ingredients
        // REMOVED: is_promo, etc.
    } = req.body;

    const connection = await pool.getConnection(); 

    try {
        await connection.beginTransaction();

        // UPDATED: Simplified update, removed promo logic
        // We KEEP promotion_id as is (don't change it here)
        // If they want to change promo, they use the Promotion Manager
        const sql = `
            UPDATE fb_menu_items 
            SET item_name = ?, category_id = ?, price = ?, image_url = ?, description = ?
            WHERE item_id = ?
        `;
        
        await connection.query(sql, [
            item_name, category_id, price, image_url, description, id
        ]);

        // Update Recipe
        await connection.query("DELETE FROM fb_menu_item_ingredients WHERE menu_item_id = ?", [id]);
        
        if (ingredients && ingredients.length > 0) {
            const recipeSql = "INSERT INTO fb_menu_item_ingredients (menu_item_id, ingredient_id, quantity_consumed) VALUES ?";
            const recipeValues = ingredients.map(ing => [id, ing.ingredient_id, ing.quantity_consumed]);
            await connection.query(recipeSql, [recipeValues]);
        }

        await connection.commit(); 
        res.status(200).json({ message: "Item updated successfully" });

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
    const sql = "DELETE FROM fb_menu_items WHERE item_id = ?";
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
        "SELECT i.name, i.stock_level, mi.quantity_consumed FROM fb_menu_item_ingredients mi JOIN fb_ingredients i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_item_id = ?",
        [item.item_id]
      );

        if (recipe.length === 0) {
            const [menuItem] = await connection.query("SELECT item_name FROM fb_menu_items WHERE item_id = ?", [item.item_id]);
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
 *play {Array} items - Array of objects with item_id and quantity (from cart).
 * @param {string} operation - Either 'deduct' or 'restore'.
 * @param {Object} connection - A database connection from a transaction.
 */
export const adjustStock = async (items, operation, connection) => {
    const operator = operation === 'deduct' ? '-' : '+';
    
    for (const item of items) {
        const [recipe] = await connection.query(
            "SELECT ingredient_id, quantity_consumed FROM fb_menu_item_ingredients WHERE menu_item_id = ?",
            [item.item_id]
        );

        for (const ing of recipe) {
            const stockChange = ing.quantity_consumed * item.quantity;
            const stockSql = `UPDATE fb_ingredients SET stock_level = stock_level ${operator} ? WHERE ingredient_id = ?`;
            await connection.query(stockSql, [stockChange, ing.ingredient_id]);
        }
    }
};

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
        "SELECT ingredient_id, quantity_consumed FROM fb_menu_item_ingredients WHERE menu_item_id = ?",
        [item.item_id]
      );

      for (const ing of recipe) {
        const quantity_change = ing.quantity_consumed * item.quantity;
        
        // 2. Get the new stock level (AFTER the change was made)
        const [stockRows] = await connection.query(
          "SELECT stock_level FROM fb_ingredients WHERE ingredient_id = ?",
          [ing.ingredient_id]
        );
        const new_stock_level = stockRows[0].stock_level;

        // 3. Create the log
        const logSql = "INSERT INTO fb_inventory_logs (ingredient_id, staff_id, action_type, quantity_change, new_stock_level, reason) VALUES (?, ?, ?, ?, ?, ?)";
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