import pool from "../config/mysql.js";

// Helper function to create a log entry
const createLog = async (ingredient_id, staff_id, action_type, quantity_change, new_stock_level, reason, connection) => {
    const logSql = "INSERT INTO inventory_logs (ingredient_id, staff_id, action_type, quantity_change, new_stock_level, reason) VALUES (?, ?, ?, ?, ?, ?)";
    await (connection || pool).query(logSql, [ingredient_id, staff_id, action_type, quantity_change, new_stock_level, reason || null]);
};

// @desc    Get all ingredients
// @route   GET /api/inventory
// @access  Staff
export const getAllIngredients = async (req, res) => {
    try {
        const [ingredients] = await pool.query("SELECT * FROM ingredients ORDER BY name ASC");
        res.json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error fetching ingredients", error: error.message });
    }
};

// @desc    Get single ingredient by ID
// @route   GET /api/inventory/:id
// @access  Staff
export const getIngredientById = async (req, res) => {
    try {
        const [ingredients] = await pool.query("SELECT * FROM ingredients WHERE ingredient_id = ?", [req.params.id]);
        if (ingredients.length === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        res.json(ingredients[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching ingredient", error: error.message });
    }
};

// @desc    Create a new ingredient
// @route   POST /api/inventory
// @access  Staff
export const createIngredient = async (req, res) => {
    const { name, stock_level = 0, unit_of_measurement } = req.body;
    const staff_id = req.user.id; // From protect middleware

    if (!name || !unit_of_measurement) {
        return res.status(400).json({ message: "Name and unit of measurement are required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const sql = "INSERT INTO ingredients (name, stock_level, unit_of_measurement) VALUES (?, ?, ?)";
        const [result] = await connection.query(sql, [name, stock_level, unit_of_measurement]);
        const newIngredientId = result.insertId;

        // Log the initial stock
        await createLog(newIngredientId, staff_id, 'INITIAL', stock_level, stock_level, 'Ingredient created', connection);
        
        await connection.commit();
        res.status(201).json({
            ingredient_id: newIngredientId,
            name,
            stock_level,
            unit_of_measurement
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Error creating ingredient", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Update ingredient details (name, unit)
// @route   PUT /api/inventory/:id
// @access  Staff
export const updateIngredientDetails = async (req, res) => {
    const { name, unit_of_measurement } = req.body;
    const { id } = req.params;

    if (!name || !unit_of_measurement) {
        return res.status(400).json({ message: "Name and unit of measurement are required." });
    }

    try {
        const sql = "UPDATE ingredients SET name = ?, unit_of_measurement = ? WHERE ingredient_id = ?";
        const [result] = await pool.query(sql, [name, unit_of_measurement, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        res.json({ message: "Ingredient details updated" });
    } catch (error) {
        res.status(500).json({ message: "Error updating ingredient", error: error.message });
    }
};

// @desc    Adjust ingredient stock (Restock, Waste, etc.)
// @route   PUT /api/inventory/:id/stock
// @access  Staff
export const adjustIngredientStock = async (req, res) => {
    const { id } = req.params;
    const { quantity_change, action_type, reason } = req.body; // e.g., quantity_change: 500, action_type: "RESTOCK"
    const staff_id = req.user.id;

    if (!quantity_change || !action_type) {
        return res.status(400).json({ message: "Quantity change and action type are required." });
    }

    const parsedQty = parseFloat(quantity_change);
    if (isNaN(parsedQty)) {
        return res.status(400).json({ message: "Invalid quantity change." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // Lock the row for update
        const [rows] = await connection.query("SELECT stock_level FROM ingredients WHERE ingredient_id = ? FOR UPDATE", [id]);
        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Ingredient not found" });
        }
        
        const currentStock = parseFloat(rows[0].stock_level);
        let newStockLevel;

        if (action_type === 'RESTOCK' || action_type === 'ADJUST_ADD') {
            newStockLevel = currentStock + parsedQty;
        } else if (action_type === 'WASTE' || action_type === 'ADJUST_SUBTRACT') {
            newStockLevel = currentStock - parsedQty;
            if (newStockLevel < 0) {
                // You can decide to allow this or not
                // newStockLevel = 0; // Option: prevent negative stock
                console.warn(`Ingredient ${id} stock is now negative.`);
            }
        } else {
            await connection.rollback();
            return res.status(400).json({ message: "Invalid action type." });
        }

        // Update the stock
        await connection.query("UPDATE ingredients SET stock_level = ? WHERE ingredient_id = ?", [newStockLevel, id]);

        // Create the log entry
        await createLog(id, staff_id, action_type, parsedQty, newStockLevel, reason, connection);

        await connection.commit();
        res.json({ message: "Stock updated successfully", new_stock_level: newStockLevel });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Error updating stock", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Delete an ingredient
// @route   DELETE /api/inventory/:id
// @access  Staff
export const deleteIngredient = async (req, res) => {
    // Note: Deleting an ingredient will fail if it's used in a recipe
    // due to the foreign key constraint, which is good!
    try {
        const [result] = await pool.query("DELETE FROM ingredients WHERE ingredient_id = ?", [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        res.json({ message: "Ingredient deleted successfully" });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ message: "Cannot delete ingredient. It is currently used in a menu item recipe." });
        }
        res.status(500).json({ message: "Error deleting ingredient", error: error.message });
    }
};

// @desc    Get all inventory logs
// @route   GET /api/inventory/logs
// @access  Admin
export const getInventoryLogs = async (req, res) => {
    try {
        // --- ⭐️ FIX: Changed 'JOIN staff' to 'LEFT JOIN staff' ---
        // This ensures that even if staff_id is NULL (for order logs),
        // the log entry is still returned.
        const sql = `
            SELECT 
                l.*, 
                i.name as ingredient_name, 
                COALESCE(CONCAT(s.first_name, ' ', s.last_name), 'System (Order)') as staff_name
            FROM inventory_logs l
            JOIN ingredients i ON l.ingredient_id = i.ingredient_id
            LEFT JOIN staff s ON l.staff_id = s.staff_id
            ORDER BY l.timestamp DESC
            LIMIT 100
        `;
        const [logs] = await pool.query(sql);
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching inventory logs", error: error.message });
    }
};