import pool from "../config/mysql.js";

// Helper function to create a log entry
const createLog = async (ingredient_id, employee_id, action_type, quantity_change, new_stock_level, reason, connection) => {
    const logSql = "INSERT INTO fb_inventory_logs (ingredient_id, employee_id, action_type, quantity_change, new_stock_level, reason) VALUES (?, ?, ?, ?, ?, ?)";
    await (connection || pool).query(logSql, [ingredient_id, employee_id, action_type, quantity_change, new_stock_level, reason || null]);
};

// @desc    Get all ingredients
export const getAllIngredients = async (req, res) => {
    try {
        const [ingredients] = await pool.query("SELECT * FROM fb_ingredients ORDER BY name ASC");
        res.json(ingredients);
    } catch (error) {
        res.status(500).json({ message: "Error fetching ingredients", error: error.message });
    }
};

// @desc    Get single ingredient by ID
export const getIngredientById = async (req, res) => {
    try {
        const [ingredients] = await pool.query("SELECT * FROM fb_ingredients WHERE ingredient_id = ?", [req.params.id]);
        if (ingredients.length === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        res.json(ingredients[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching ingredient", error: error.message });
    }
};

// @desc    Create a new ingredient
export const createIngredient = async (req, res) => {
    // ✅ Extract reorder_point from request (Default to 10 if missing)
    const { name, stock_level = 0, unit_of_measurement, reorder_point = 10 } = req.body;

    if (!name || !unit_of_measurement) {
        return res.status(400).json({ message: "Name and unit of measurement are required." });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. HRIS INTEGRATION: Get employee_id using the logged-in user_id
        const [empRows] = await connection.query(
            "SELECT employee_id FROM employees WHERE user_id = ?", 
            [req.user.id]
        );
        
        if (empRows.length === 0) {
            throw new Error("HRIS Staff profile not found for this user.");
        }
        const employee_id = empRows[0].employee_id;

        // 2. Insert Ingredient (✅ Added reorder_point column)
        const sql = "INSERT INTO fb_ingredients (name, stock_level, unit_of_measurement, reorder_point) VALUES (?, ?, ?, ?)";
        const [result] = await connection.query(sql, [name, stock_level, unit_of_measurement, reorder_point]);
        const newIngredientId = result.insertId;

        // 3. Log using employee_id
        await createLog(newIngredientId, employee_id, 'INITIAL', stock_level, stock_level, 'Ingredient created', connection);
        
        await connection.commit();
        res.status(201).json({
            ingredient_id: newIngredientId,
            name,
            stock_level,
            unit_of_measurement,
            reorder_point // ✅ Return new value
        });
    } catch (error) {
        await connection.rollback();
        console.error("Create Ingredient Error:", error);
        res.status(500).json({ message: "Error creating ingredient", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Update ingredient details
export const updateIngredientDetails = async (req, res) => {
    // ✅ Extract reorder_point to allow editing
    const { name, unit_of_measurement, reorder_point } = req.body;
    const { id } = req.params;

    if (!name || !unit_of_measurement) {
        return res.status(400).json({ message: "Name and unit of measurement are required." });
    }

    try {
        // ✅ Update SQL query to include reorder_point
        const sql = "UPDATE fb_ingredients SET name = ?, unit_of_measurement = ?, reorder_point = ? WHERE ingredient_id = ?";
        // Use a default (10) if reorder_point is somehow undefined, though frontend should send it
        const safeReorderPoint = reorder_point !== undefined ? reorder_point : 10;
        
        const [result] = await pool.query(sql, [name, unit_of_measurement, safeReorderPoint, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Ingredient not found" });
        }
        res.json({ message: "Ingredient details updated" });
    } catch (error) {
        res.status(500).json({ message: "Error updating ingredient", error: error.message });
    }
};

// @desc    Adjust ingredient stock
export const adjustIngredientStock = async (req, res) => {
    const { id } = req.params;
    const { quantity_change, action_type, reason } = req.body; 

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

        // 1. HRIS INTEGRATION: Get employee_id
        const [empRows] = await connection.query(
            "SELECT employee_id FROM employees WHERE user_id = ?", 
            [req.user.id]
        );
        if (empRows.length === 0) {
            throw new Error("HRIS Staff profile not found.");
        }
        const employee_id = empRows[0].employee_id;

        // 2. Lock row
        const [rows] = await connection.query("SELECT stock_level FROM fb_ingredients WHERE ingredient_id = ? FOR UPDATE", [id]);
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
                console.warn(`Ingredient ${id} stock is now negative.`);
            }
        } else {
            await connection.rollback();
            return res.status(400).json({ message: "Invalid action type." });
        }

        // 3. Update stock
        await connection.query("UPDATE fb_ingredients SET stock_level = ? WHERE ingredient_id = ?", [newStockLevel, id]);

        // 4. Create log using employee_id
        await createLog(id, employee_id, action_type, parsedQty, newStockLevel, reason, connection);

        await connection.commit();
        res.json({ message: "Stock updated successfully", new_stock_level: newStockLevel });

    } catch (error) {
        await connection.rollback();
        console.error("Adjust Stock Error:", error);
        res.status(500).json({ message: "Error updating stock", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Delete an ingredient
export const deleteIngredient = async (req, res) => {
    try {
        const [result] = await pool.query("DELETE FROM fb_ingredients WHERE ingredient_id = ?", [req.params.id]);
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
export const getInventoryLogs = async (req, res) => {
    try {
        const sql = `
        SELECT 
            l.*, 
            i.name as ingredient_name, 
            COALESCE(CONCAT(e.first_name, ' ', e.last_name), 'System (Order)') as staff_name
        FROM fb_inventory_logs l
        JOIN fb_ingredients i ON l.ingredient_id = i.ingredient_id
        LEFT JOIN employees e ON l.employee_id = e.employee_id 
        ORDER BY l.timestamp DESC
        LIMIT 100
    `;
        const [logs] = await pool.query(sql);
        res.json(logs);
    } catch (error) {
        console.error("Get Logs Error:", error);
        res.status(500).json({ message: "Error fetching inventory logs", error: error.message });
    }
};