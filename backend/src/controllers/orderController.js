import pool from "../config/mysql.js";
import { validateStock, adjustStock, logOrderStockChange } from "./itemController.js";

// --- (Constants are unchanged) ---
const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%


// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_id, items, order_type, instructions, delivery_location } = req.body;

        if (!customer_id || !items || items.length === 0 || !delivery_location) {
            throw new Error("Missing required order information.");
        }
        
        // Create the initial order record
        const orderSql = "INSERT INTO orders (customer_id, order_type, delivery_location, status) VALUES (?, ?, ?, 'Pending')";
        const [orderResult] = await connection.query(orderSql, [customer_id, order_type, delivery_location]);
        const order_id = orderResult.insertId;

        // --- Calculate totals ---
        let calculatedItemsTotal = 0; 
        
        // --- 1. VALIDATE STOCK IS REMOVED ---
        // We no longer validate stock on creation.

        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            
            calculatedItemsTotal += subtotal;
            
            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal, instructions) VALUES (?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal, instructions]);
        }

        // --- Perform backend-side financial calculations ---
        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        // --- Update the order with the calculated financial data ---
        const updateSql = `
            UPDATE orders 
            SET 
                items_total = ?, 
                service_charge_amount = ?, 
                vat_amount = ?, 
                total_amount = ? 
            WHERE order_id = ?
        `;
        await connection.query(updateSql, [
            calculatedItemsTotal,
            calculatedServiceCharge,
            calculatedVatAmount,
            calculatedTotalAmount,
            order_id
        ]);

        // --- 2. DEDUCT STOCK AND LOGS ARE REMOVED ---
        // await adjustStock(items, 'deduct', connection);
        // await logOrderStockChange(order_id, items, 'ORDER_DEDUCT', connection);
        // console.log(`Ingredient stock deducted and logged for order ${order_id}`);

        await connection.commit();

        res.status(201).json({
            order_id,
            total_amount: calculatedTotalAmount,
            message: "Order created successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error("CREATE ORDER ERROR:", error);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};

// ... (getOrders and getOrderById remain the same) ...
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
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

    const [orders] = await pool.query(
        "SELECT *, items_total, service_charge_amount, vat_amount FROM orders WHERE order_id = ?", 
        [id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }
    const order = orders[0];

    // Fetch ordered items
    const [items] = await pool.query(
    `SELECT mi.item_name, od.quantity, mi.price 
    FROM order_details od 
    JOIN menu_items mi ON od.item_id = mi.item_id 
    WHERE od.order_id = ?`,
    [id]
    );

    // Fetch payment info
    const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [id]);
    const payment = payments[0] || {};

    res.json({
      order_id: order.order_id,
      order_date: order.order_date,
      order_type: order.order_type,
      delivery_location: order.delivery_location,
      items_total: order.items_total,
      service_charge_amount: order.service_charge_amount,
      vat_amount: order.vat_amount,
      total_price: order.total_amount,
      status: order.status,
      items,
      payment_method: payment.payment_method || "PayMongo",
      payment_status: payment.payment_status || "paid",
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ message: "Error fetching order details", error: error.message });
  }
};


// @desc    Update order operational status (e.g., Preparing, Served)
// @route   PUT /api/orders/:id/status
// @access  Private (Staff/Admin)
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // --- 1. GET CURRENT STATUS FIRST ---
        // Lock the row to prevent race conditions
        const [orders] = await connection.query("SELECT status FROM orders WHERE order_id = ? FOR UPDATE", [id]);
        if (orders.length === 0) {
            throw new Error("Order not found");
        }
        const currentStatus = orders[0].status;

        // --- 2. NEW LOGIC: DEDUCT STOCK WHEN MOVING TO "PREPARING" ---
        if (status.toLowerCase() === 'preparing' && currentStatus === 'pending') {
            // This is the "Accept" action. We commit ingredients here.
            const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
            
            // Validate stock BEFORE proceeding
            await validateStock(details, connection); // Throws error if not enough stock
            
            // Deduct stock and log it
            await adjustStock(details, 'deduct', connection);
            await logOrderStockChange(id, details, 'ORDER_DEDUCT', connection);
            console.log(`Ingredient stock deducted and logged for order ${id}`);
        }
        // --- 3. MODIFIED LOGIC: RESTORE STOCK ONLY IF IT WAS DEDUCTED ---
        else if (status.toLowerCase() === 'cancelled') {
            // Only restore stock if the order was in a state where stock was already taken
            if (currentStatus === 'preparing' || currentStatus === 'ready') {
                const [payments] = await connection.query("SELECT * FROM payments WHERE order_id = ? AND payment_status = 'paid'", [id]);

                if (payments.length > 0) {
                    console.warn(`Order ${id} was already paid. Cancellation requested, but stock NOT restored automatically.`);
                } else {
                    console.log(`Restoring ingredient stock for cancelled unpaid order: ${id}`);
                    const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
                    
                    // Restore stock
                    await adjustStock(details, 'restore', connection);
                    await logOrderStockChange(id, details, 'ORDER_RESTORE', connection);
                }
            }
            // If currentStatus is 'pending', no stock was taken, so we do nothing.
        }

        // --- 4. UPDATE STATUS (This runs for all status changes) ---
        const [result] = await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
        if (result.affectedRows === 0) {
            // This case should be caught by the check above, but good to keep
            throw new Error("Order not found");
        }

        await connection.commit();
        res.json({ message: `Order status updated to ${status}` });

    } catch (error) {
        await connection.rollback();
        // --- 5. CATCH VALIDATION ERRORS ---
        // Send a 400 (Bad Request) if stock validation fails, so the kitchen UI can display it.
        if (error.message.startsWith("Not enough stock")) {
            console.error(`Stock validation failed for order ${id}: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
        // Otherwise, send a generic 500 error.
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    } finally {
        connection.release();
    }
};


// ... (getKitchenOrders and getServedOrders remain the same) ...
// @desc    Get orders for the kitchen
// @route   GET /api/orders/kitchen
// @access  Private (Staff)
export const getKitchenOrders = async (req, res) => {
    try {
        const sql = `
            SELECT o.*, c.first_name, c.last_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.status IN ('Pending', 'Preparing', 'Ready')
            ORDER BY o.order_date ASC
        `;

        const [orders] = await pool.query(sql);

        res.json(orders);

    } catch (error) {
        console.error("Error fetching kitchen orders:", error);
        res.status(500).json({ message: "Error fetching kitchen orders", error: error.message });
    }
};

// @desc    Get served/completed orders
// @route   GET /api/orders/served
// @access  Private (Staff)
export const getServedOrders = async (req, res) => {
    try {
        const sql = `
            SELECT o.*, c.first_name, c.last_name
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.status = 'Served' OR o.status = 'Completed'
            ORDER BY o.order_date DESC
        `;
        const [orders] = await pool.query(sql);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching served orders:", error);
        res.status(500).json({ message: "Error fetching served orders", error: error.message });
    }
};