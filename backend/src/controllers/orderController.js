import pool from "../config/mysql.js";
// --- (itemController imports are unchanged) ---
import { validateStock, adjustStock, logOrderStockChange } from "./itemController.js";

// --- DEFINE CONSTANTS HERE ---
// By defining rates on the backend, they are secure and easy to update.
const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%


// @desc    Create a new order (Deducts stock immediately)
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. 'total_price' is REMOVED from req.body ---
        // We will calculate it on the backend.
        const { customer_id, items, order_type, instructions, delivery_location } = req.body;

        if (!customer_id || !items || items.length === 0 || !delivery_location) {
            throw new Error("Missing required order information.");
        }
        
        // --- 2. Create the initial order record ---
        // We will update the financial fields in a moment.
        const orderSql = "INSERT INTO orders (customer_id, order_type, delivery_location, status) VALUES (?, ?, ?, 'Pending')";
        const [orderResult] = await connection.query(orderSql, [customer_id, order_type, delivery_location]);
        const order_id = orderResult.insertId;

        // --- 3. Validate stock AND calculate totals ---
        let calculatedItemsTotal = 0; // This is our new 'items_total'
        
        await validateStock(items, connection); // Validates stock first

        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            
            calculatedItemsTotal += subtotal; // Add to the grand subtotal
            
            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal, instructions) VALUES (?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal, instructions]);
        }

        // --- 4. Perform backend-side financial calculations ---
        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        // VAT is calculated on subtotal + service charge
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        // --- 5. Update the order with the calculated financial data ---
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

        // --- 6. Deduct stock and log the change ---
        await adjustStock(items, 'deduct', connection);
        await logOrderStockChange(order_id, items, 'ORDER_DEDUCT', connection);
        console.log(`Ingredient stock deducted and logged for order ${order_id}`);

        await connection.commit();

        // --- 7. Return the 'order_id' and the final 'total_amount' ---
        // The frontend needs this total_amount for the PayMongo request.
        res.status(201).json({
            order_id,
            total_amount: calculatedTotalAmount, // Send the secure, calculated total
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

// ... (getOrders remains the same) ...
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

    // --- 1. Fetch order record (including new financial columns) ---
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

    // --- 2. Build clean response with all financial details ---
    res.json({
      order_id: order.order_id,
      order_date: order.order_date,
      order_type: order.order_type,
      delivery_location: order.delivery_location,
      
      // The financial breakdown for the receipt
      items_total: order.items_total,
      service_charge_amount: order.service_charge_amount,
      vat_amount: order.vat_amount,
      total_price: order.total_amount, // 'total_price' is the key the frontend expects
      
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


// ... (updateOrderStatus remains the same) ...
// @desc    Update order operational status (e.g., Preparing, Served)
// @route   PUT /api/orders/:id/status
// @access  Private (Staff/Admin)
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        if (status.toLowerCase() === 'cancelled') {
             const [payments] = await connection.query("SELECT * FROM payments WHERE order_id = ? AND payment_status = 'paid'", [id]);

            if (payments.length > 0) {
                 console.warn(`Order ${id} was already paid. Cancellation requested, but stock NOT restored automatically.`);
            } else {
                 console.log(`Restoring ingredient stock for cancelled unpaid order: ${id}`);
                 const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
                 
                 // Restore stock
                 await adjustStock(details, 'restore', connection);
                 
                 // --- ⭐️ NEW LOGGING STEP ⭐️ ---
                 await logOrderStockChange(id, details, 'ORDER_RESTORE', connection);
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