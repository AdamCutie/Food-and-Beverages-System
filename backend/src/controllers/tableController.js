import pool from "../config/mysql.js";

// @desc    Get all tables
// @route   GET /api/tables
// @access  Public (for Menu/POS)
export const getAllTables = async (req, res) => {
    try {
        const [tables] = await pool.query("SELECT * FROM fb_tables ORDER BY CAST(table_number AS UNSIGNED) ASC");
        res.json(tables);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tables", error: error.message });
    }
};

// @desc    Update Table Status
// @route   PUT /api/tables/:id/status
// @access  Staff
export const updateTableStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'Available', 'Occupied', 'Reserved'

    if (!['Available', 'Occupied', 'Reserved'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value." });
    }

    try {
        // 1. Update Database
        const [result] = await pool.query("UPDATE fb_tables SET status = ? WHERE table_id = ?", [status, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Table not found" });
        }

        // ---------------------------------------------------------
        // ⭐ NEW CODE: Broadcast the change to everyone!
        // ---------------------------------------------------------
        const io = req.app.get('io'); // Get the socket instance
        if (io) {
            io.emit('table-update', { 
                table_id: parseInt(id), 
                status: status 
            });
            console.log(`📡 Emitted table-update: Table ${id} is now ${status}`);
        }
        // ---------------------------------------------------------

        res.json({ message: `Table ${id} is now ${status}` });
    } catch (error) {
        res.status(500).json({ message: "Error updating table status", error: error.message });
    }
};

// @desc    Create a new Table
// @route   POST /api/tables
// @access  F&B Admin
export const createTable = async (req, res) => {
    const { table_number, capacity } = req.body;
    if (!table_number || !capacity) {
        return res.status(400).json({ message: "Table number and capacity are required." });
    }
    
    try {
        // Check for duplicates
        const [exists] = await pool.query("SELECT * FROM fb_tables WHERE table_number = ?", [table_number]);
        if (exists.length > 0) {
            return res.status(400).json({ message: `Table ${table_number} already exists.` });
        }

        await pool.query(
            "INSERT INTO fb_tables (table_number, capacity, status) VALUES (?, ?, 'Available')",
            [table_number, capacity]
        );
        res.status(201).json({ message: "Table created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating table", error: error.message });
    }
};

// @desc    Update Table Details (Capacity/Number)
// @route   PUT /api/tables/:id
// @access  F&B Admin
export const updateTable = async (req, res) => {
    const { id } = req.params;
    const { table_number, capacity } = req.body;

    try {
        await pool.query(
            "UPDATE fb_tables SET table_number = ?, capacity = ? WHERE table_id = ?",
            [table_number, capacity, id]
        );
        res.json({ message: "Table updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating table", error: error.message });
    }
};

// @desc    Delete Table
// @route   DELETE /api/tables/:id
// @access  F&B Admin
export const deleteTable = async (req, res) => {
    const { id } = req.params;
    try {
        // Because of "ON DELETE SET NULL" in database, this is safe to delete
        await pool.query("DELETE FROM fb_tables WHERE table_id = ?", [id]);
        res.json({ message: "Table deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting table", error: error.message });
    }
};