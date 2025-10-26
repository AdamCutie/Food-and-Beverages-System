import pool from "../config/mysql.js";
import { validateStock, adjustStock } from "./itemController.js"; 


// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- FIX: Destructure all fields from the body ---
        const { customer_id, items, order_type, instructions, total_price, delivery_location } = req.body;

        if (!customer_id || !items || items.length === 0 || !delivery_location) {
            throw new Error("Missing required order information.");
        }

        // --- FIX: Use total_price from the frontend and name it correctly for the DB ---
        const total_amount = total_price; 

        // Step 2: Create the order, now including the order_type
        const orderSql = "INSERT INTO orders (customer_id, total_amount, order_type, delivery_location) VALUES (?, ?, ?, ?)";
        const [orderResult] = await connection.query(orderSql, [customer_id, total_amount, order_type, delivery_location]);
        const order_id = orderResult.insertId;

        // Step 3: Insert order details, now including the instructions
        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            
            // --- FIX: Correctly insert instructions into order_details ---
            // Note: This applies the same instruction to all items.
            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal, instructions) VALUES (?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal, instructions]);

            const stockSql = "UPDATE menu_items SET stock = stock - ? WHERE item_id = ?";
            await connection.query(stockSql, [item.quantity, item.item_id]);
        }
        
        // Step 4: Adjust stock using the helper function
        await adjustStock(items, 'deduct', connection);

        await connection.commit();
        res.status(201).json({ order_id, message: "Order created successfully" });

    } catch (error) {
        await connection.rollback();
        console.error("CREATE ORDER ERROR:", error); // Log the full error for debugging
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
    // This function is also working, so we leave it.
    try {
        const [orders] = await pool.query('SELECT * FROM orders ORDER BY order_date DESC');
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// @desc    Get a single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [orders] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [id]);
        
        if (orders.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        const order = orders[0];

        // --- TEMPORARILY COMMENTED OUT FOR DEVELOPMENT ---
        /*
        // CRITICAL FIX: Ensure a customer can only view their own orders.
        if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
            return res.status(403).json({ message: "Access forbidden: You can only view your own orders." });
        }
        */

        const [details] = await pool.query("SELECT od.*, mi.item_name FROM order_details od JOIN menu_items mi ON od.item_id = mi.item_id WHERE order_id = ?", [id]);

        res.json({ ...order, details });
    } catch (error) {
        res.status(500).json({ message: "Error fetching order details", error: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff/Admin)
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // --- We will assume for now that anyone can update the status ---

        if (status === 'cancelled') {
            const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
            for (const item of details) {
                await connection.query("UPDATE menu_items SET stock = stock + ? WHERE item_id = ?", [item.quantity, item.item_id]);
            }
        }

        const [result] = await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
        if (result.affectedRows === 0) {
            throw new Error("Order not found");
        }
        
        await connection.commit();
        res.json({ message: `Order status updated to ${status}` });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    } finally {
        connection.release();
    }
};


// Test for Kitchen Orders

export const getKitchenOrders = async (req, res) => {
    try {
        // Select orders where status is 'Pending', ordered by oldest first
        // Also include customer name
        const sql = `
            SELECT o.*, c.first_name, c.last_name 
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.status = 'Pending' 
            ORDER BY o.order_date ASC
        `;
        const [orders] = await pool.query(sql);

        // We will fetch details separately on the frontend if needed
        res.json(orders);

    } catch (error) {
        console.error("Error fetching kitchen orders:", error);
        res.status(500).json({ message: "Error fetching kitchen orders", error: error.message });
    }
};