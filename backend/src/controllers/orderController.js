import pool from "../config/mysql.js";

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { items } = req.body;
        const customer_id = req.user.id;
        let total_amount = 0;

        // Step 1: Validate stock and calculate total amount
        for (const item of items) {
            const [rows] = await connection.query("SELECT price, stock FROM menu_items WHERE item_id = ?", [item.item_id]);
            if (rows.length === 0) {
                throw new Error(`Item with ID ${item.item_id} not found.`);
            }
            if (rows[0].stock < item.quantity) {
                throw new Error(`Not enough stock for item ID ${item.item_id}. Available: ${rows[0].stock}, Requested: ${item.quantity}`);
            }
            total_amount += rows[0].price * item.quantity;
        }

        // Step 2: Create the order
        const orderSql = "INSERT INTO orders (customer_id, total_amount) VALUES (?, ?)";
        const [orderResult] = await connection.query(orderSql, [customer_id, total_amount]);
        const order_id = orderResult.insertId;

        // Step 3: Insert order details and deduct stock
        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;

            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal) VALUES (?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal]);

            const stockSql = "UPDATE menu_items SET stock = stock - ? WHERE item_id = ?";
            await connection.query(stockSql, [item.quantity, item.item_id]);
        }

        await connection.commit();
        res.status(201).json({ order_id, message: "Order created successfully" });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Get all orders (for staff) or user's orders (for customer)
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
    try {
        let sql;
        let params = [];
        if (req.user.role === 'customer') {
            sql = "SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC";
            params.push(req.user.id);
        } else { // Staff can see all orders
            sql = "SELECT * FROM orders ORDER BY order_date DESC";
        }

        const [orders] = await pool.query(sql, params);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};


// @desc    Get a single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const [order] = await pool.query("SELECT * FROM orders WHERE order_id = ?", [id]);
        
        if (order.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        const [details] = await pool.query("SELECT od.*, mi.item_name FROM order_details od JOIN menu_items mi ON od.item_id = mi.item_id WHERE order_id = ?", [id]);

        res.json({ ...order[0], details });
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

        if (status === 'cancelled') {
            // Restore stock if order is cancelled
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