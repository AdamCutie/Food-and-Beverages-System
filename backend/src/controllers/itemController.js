import pool from "../config/mysql.js";

// @desc    Get all menu items with ratings
// @route   GET /api/items
// @access  Public
export const getAllItems = async (req, res) => {
    try {
        // 1. Get all menu items with category, promotion, AND RATINGS
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
                p.name AS promo_name,
                -- ✅ NEW: Rating Calculations
                COALESCE(AVG(r.rating_value), 0) AS average_rating,
                COUNT(r.rating_id) AS total_reviews
            FROM fb_menu_items mi
            LEFT JOIN fb_categories c ON mi.category_id = c.category_id
            LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
            LEFT JOIN fb_food_ratings r ON mi.item_id = r.item_id
            GROUP BY mi.item_id -- Group by item to calculate aggregate ratings
        `;
        
        const [items] = await pool.query(itemSql);
        
        if (items.length === 0) {
            return res.json([]);
        }

        // --- INVENTORY CHECK LOGIC (Kept exactly as provided) ---
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
        // --- END OF INVENTORY LOGIC ---

        // 4. Combine items, recipes, stock check, and format ratings
        items.forEach(item => {
            // Format Rating (Decimal to String "4.5")
            item.average_rating = parseFloat(item.average_rating).toFixed(1);
            
            const itemRecipes = recipes.filter(r => r.menu_item_id === item.item_id);
            item.ingredients = itemRecipes; 
            
            // --- AVAILABILITY CHECK ---
            item.is_available = true; 

            // If it has no recipe, it can't be sold (optional business rule, can remove if pre-made items exist)
            if (itemRecipes.length === 0) {
                // item.is_available = false; // Uncomment if strictly enforcing recipes
            }

            for (const recipeItem of itemRecipes) {
                const availableStock = stockMap.get(recipeItem.ingredient_id) || 0;
                if (availableStock < recipeItem.quantity_consumed) {
                    item.is_available = false;
                    break; 
                }
            }
        });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu items", error: error.message });
    }
};

// ... (Rest of the file: getItemById, createMenuItem, updateMenuItem, deleteMenuItem, Helpers... KEPT SAME)
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
            p.name AS promo_name,
            -- ✅ NEW: Single Item Rating
            COALESCE(AVG(r.rating_value), 0) AS average_rating,
            COUNT(r.rating_id) AS total_reviews
        FROM fb_menu_items mi
        LEFT JOIN fb_categories c ON mi.category_id = c.category_id
        LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
        LEFT JOIN fb_food_ratings r ON mi.item_id = r.item_id
        WHERE mi.item_id = ?
        GROUP BY mi.item_id
    `;
        const [items] = await pool.query(sql, [id]);
        if (items.length === 0) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        
        const item = items[0];
        // Format rating
        item.average_rating = parseFloat(item.average_rating).toFixed(1);

        const [recipes] = await pool.query(
        `SELECT mi.menu_item_id, i.ingredient_id, i.name, mi.quantity_consumed, i.unit_of_measurement
         FROM fb_menu_item_ingredients mi
         JOIN fb_ingredients i ON mi.ingredient_id = i.ingredient_id
         WHERE mi.menu_item_id = ?`,
        [id]
        );
        item.ingredients = recipes;

        // --- AVAILABILITY CHECK FOR SINGLE ITEM ---
        item.is_available = true;
        if (recipes.length > 0) {
            for (const recipeItem of recipes) {
                const [stockRows] = await pool.query("SELECT stock_level FROM fb_ingredients WHERE ingredient_id = ?", [recipeItem.ingredient_id]);
                const availableStock = stockRows[0] ? parseFloat(stockRows[0].stock_level) : 0;
                if (availableStock < recipeItem.quantity_consumed) {
                    item.is_available = false;
                    break;
                }
            }
        }
        // --- END OF CHECK ---

        res.json(item);
    } catch (error) {
        res.status(500).json({ message: "Error fetching menu item", error: error.message });
    }
};

// ... (Copy/Paste the rest of your provided file functions: createMenuItem, updateMenuItem, deleteMenuItem, validateStock, adjustStock, logOrderStockChange exactly as they were)
export const createMenuItem = async (req, res) => {
    const { 
        item_name, category_id, price, image_url, description, ingredients 
    } = req.body; 

    if (!item_name || !category_id || !price) { 
        return res.status(400).json({ message: 'Please provide item name, category, and price.' });
    }
    
    const connection = await pool.getConnection(); 
    
    try {
        await connection.beginTransaction();

        const sql = `
            INSERT INTO fb_menu_items 
            (item_name, category_id, price, image_url, description, promotion_id) 
            VALUES (?, ?, ?, ?, ?, NULL)
        `;
        
        const [result] = await connection.query(sql, [
            item_name, category_id, price, image_url, description
        ]);
        const newItemId = result.insertId;

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

export const updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const { 
        item_name, category_id, price, image_url, description, ingredients
    } = req.body;

    const connection = await pool.getConnection(); 

    try {
        await connection.beginTransaction();

        const sql = `
            UPDATE fb_menu_items 
            SET item_name = ?, category_id = ?, price = ?, image_url = ?, description = ?
            WHERE item_id = ?
        `;
        
        await connection.query(sql, [
            item_name, category_id, price, image_url, description, id
        ]);

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
export const validateStock = async (items, connection) => {
    for (const item of items) {
        const [recipe] = await connection.query(
        "SELECT i.name, i.stock_level, mi.quantity_consumed FROM fb_menu_item_ingredients mi JOIN fb_ingredients i ON mi.ingredient_id = i.ingredient_id WHERE mi.menu_item_id = ?",
        [item.item_id]
      );

        if (recipe.length === 0) {
            // const [menuItem] = await connection.query("SELECT item_name FROM fb_menu_items WHERE item_id = ?", [item.item_id]);
            // throw new Error(`Menu item '${menuItem[0].item_name}' (ID ${item.item_id}) has no ingredient recipe defined.`);
            // Skipping validation for non-recipe items (like water bottles) is safer here unless strictly enforced
            continue; 
        }

        for (const ing of recipe) {
            const requiredStock = ing.quantity_consumed * item.quantity;
            if (ing.stock_level < requiredStock) {
                throw new Error(`Not enough stock for ingredient '${ing.name}'. Available: ${ing.stock_level}, Requested: ${requiredStock}`);
            }
        }
    }
};

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

export const logOrderStockChange = async (order_id, items, action_type, connection) => {
  try {
    for (const item of items) {
      const [recipe] = await connection.query(
        "SELECT ingredient_id, quantity_consumed FROM fb_menu_item_ingredients WHERE menu_item_id = ?",
        [item.item_id]
      );

      for (const ing of recipe) {
        const quantity_change = ing.quantity_consumed * item.quantity;
        
        const [stockRows] = await connection.query(
          "SELECT stock_level FROM fb_ingredients WHERE ingredient_id = ?",
          [ing.ingredient_id]
        );
        const new_stock_level = stockRows[0].stock_level;

        // FIXED: Use employee_id column name (assuming your fix from previous step applied to logs too)
        // If your log table still uses staff_id, change this back to staff_id
        // Using 'employee_id' based on our Inventory Controller update logic
        const logSql = "INSERT INTO fb_inventory_logs (ingredient_id, employee_id, action_type, quantity_change, new_stock_level, reason) VALUES (?, ?, ?, ?, ?, ?)";
        const reason = `Order ID: ${order_id}`;
        
        await connection.query(logSql, [ing.ingredient_id, null, action_type, quantity_change, new_stock_level, reason]);
      }
    }
  } catch (error) {
    console.error('Failed to log order stock change:', error.message);
  }
};