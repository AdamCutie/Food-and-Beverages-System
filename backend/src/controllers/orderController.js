import pool from "../config/mysql.js";

// @desc    Create a new order
// @route   POST /api/orders
// @access  Customer
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { items, total_amount } = req.body;
        const customer_id = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "Order must have at least one item." });
        }

        // Create the order
        const orderSql = "INSERT INTO orders (customer_id, total_amount, order_status) VALUES (?, ?, 'placed')";
        const [orderResult] = await connection.query(orderSql, [customer_id, total_amount]);
        const order_id = orderResult.insertId;

        // Insert order details
        const orderDetailsSql = "INSERT INTO order_details (order_id, item_id, quantity, sub_total) VALUES ?";
        const orderDetailsValues = items.map(item => [order_id, item.item_id, item.quantity, item.sub_total]);
        await connection.query(orderDetailsSql, [orderDetailsValues]);
        
        await connection.commit();

        res.status(201).json({
            order_id,
            message: "Order placed successfully"
        });

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
// @access  Staff/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const staff_id = req.user.id;

        const validStatuses = ['preparing', 'ready', 'completed', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid order status." });
        }

        const [result] = await pool.query("UPDATE orders SET order_status = ?, staff_id = ? WHERE order_id = ?", [status, staff_id, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: `Order status updated to ${status}` });
    } catch (error) {
        res.status(500).json({ message: "Error updating order status", error: error.message });
    }
};