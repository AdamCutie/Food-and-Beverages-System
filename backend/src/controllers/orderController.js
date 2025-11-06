import pool from "../config/mysql.js";
import { validateStock, adjustStock, logOrderStockChange } from "./itemController.js";

const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%


// @desc    Create a new POS order (cash/staff)
// @route   POST /api/orders/pos
// @access  Private (Staff)
export const createPosOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // --- 1. GET NEW FIELDS FROM req.body ---
        const { 
          items, order_type, instructions, delivery_location, 
          payment_method, amount_tendered, change_amount 
        } = req.body;
        const staff_id = req.user.id; // From 'protect' middleware

        if (!staff_id || !items || items.length === 0 || !delivery_location) {
            throw new Error("Missing required order information.");
        }
        
        // ... (Step 1: Validate stock is unchanged)
        await validateStock(items, connection);

        // ... (Step 2: Calculate totals is unchanged)
        let calculatedItemsTotal = 0; 
        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            calculatedItemsTotal += subtotal;
        }
        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        // --- CHANGE 1: 'Pending' changed to 'pending' ---
        // This fixes the NULL bug on creation.
        const orderSql = `
            INSERT INTO orders 
            (customer_id, staff_id, order_type, delivery_location, status, items_total, service_charge_amount, vat_amount, total_amount) 
            VALUES (NULL, ?, ?, ?, 'pending', ?, ?, ?, ?)
        `;
        const [orderResult] = await connection.query(orderSql, [
            staff_id, 
            order_type, 
            delivery_location, 
            calculatedItemsTotal,
            calculatedServiceCharge,
            calculatedVatAmount,
            calculatedTotalAmount
        ]);
        const order_id = orderResult.insertId;

        // ... (Step 4: Create order details is unchanged)
        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            const itemInstructions = item.instructions || instructions || '';
            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal, instructions) VALUES (?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal, itemInstructions]);
        }
        
        // ... (Step 5: Deduct stock is unchanged)
        await adjustStock(items, 'deduct', connection);
        
        // ... (Step 6: Log the stock deduction is unchanged)
        await logOrderStockChange(order_id, items, 'ORDER_DEDUCT', connection);

        // --- 7. UPDATE THE PAYMENT INSERTION ---
        const paymentSql =
            "INSERT INTO payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
        await connection.query(paymentSql, [
            order_id,
            payment_method || "Cash",
            amount_tendered, // This is the amount the customer handed over
            change_amount    // This is the change we calculated
        ]);
        // --- END OF UPDATE ---

        // ... (Commit, response, error handling is unchanged)
        await connection.commit();

        res.status(201).json({
            order_id,
            total_amount: calculatedTotalAmount,
            message: "POS order created successfully"
        });

    } catch (error) {
        await connection.rollback();
        console.error("CREATE POS ORDER ERROR:", error);
         if (error.message.startsWith("Not enough stock")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Create a new order (customer)
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
        
        // --- CHANGE 2: 'Pending' changed to 'pending' ---
        // This fixes the NULL bug on creation.
        const orderSql = "INSERT INTO orders (customer_id, order_type, delivery_location, status) VALUES (?, ?, ?, 'pending')";
        const [orderResult] = await connection.query(orderSql, [customer_id, order_type, delivery_location]);
        const order_id = orderResult.insertId;

        let calculatedItemsTotal = 0; 
        
        for (const item of items) {
            const [rows] = await connection.query("SELECT price FROM menu_items WHERE item_id = ?", [item.item_id]);
            const subtotal = rows[0].price * item.quantity;
            
            calculatedItemsTotal += subtotal;
            
            const detailSql = "INSERT INTO order_details (order_id, item_id, quantity, subtotal, instructions) VALUES (?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, subtotal, instructions]);
        }

        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

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

        // --- ADDED: Create the first "pending" notification ---
        await createOrUpdateNotification(order_id, customer_id, 'pending', connection);
        // --- END OF ADDITION ---

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

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res) => {
    // This function is unchanged
    try {
        const sql = `
            SELECT 
                o.*,
                c.first_name,
                c.last_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `;
        const [orders] = await pool.query(sql);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  // This function is unchanged
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

    const [items] = await pool.query(
    `SELECT 
        mi.item_name, 
        od.quantity, 
        mi.price,
        od.instructions,
        od.order_detail_id AS detail_id
    FROM order_details od 
    JOIN menu_items mi ON od.item_id = mi.item_id 
    WHERE od.order_id = ?`,
    [id]
    );

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


// @desc    Update any order status
// @route   PUT /api/orders/:id/status
// @access  Private (Staff)
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    const connection = await pool.getConnection();
    
    const staff_id = req.user.id; 
    const newStatus = status.toLowerCase();

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    try {
        await connection.beginTransaction();

        // Get current order status AND customer_id
        const [orders] = await connection.query("SELECT status, customer_id FROM orders WHERE order_id = ? FOR UPDATE", [id]);
        if (orders.length === 0) {
            throw new Error("Order not found");
        }
        const currentStatus = orders[0].status;
        const customer_id = orders[0].customer_id; // Get customer_id

        if (currentStatus === newStatus) {
             return res.status(400).json({ message: `Order is already ${newStatus}` });
        }

        // --- BUSINESS LOGIC BLOCK ---
        if (newStatus === 'preparing' && currentStatus === 'pending') {
            console.log(`Deducting stock for order ${id}...`);
            const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
            
            await validateStock(details, connection);
            await adjustStock(details, 'deduct', connection);
            await logOrderStockChange(id, details, 'ORDER_DEDUCT', connection);
            console.log(`Ingredient stock deducted and logged for order ${id}`);

        } else if (newStatus === 'cancelled') {
            if (currentStatus === 'preparing' || currentStatus === 'ready') {
                const [payments] = await connection.query("SELECT * FROM payments WHERE order_id = ? AND payment_status = 'paid'", [id]);

                if (payments.length > 0) {
                    console.warn(`Order ${id} was already paid. Cancellation requested, but stock NOT restored automatically.`);
                } else {
                    console.log(`Restoring ingredient stock for cancelled unpaid order: ${id}`);
                    const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
                    
                    await adjustStock(details, 'restore', connection);
                    await logOrderStockChange(id, details, 'ORDER_RESTORE', connection);
                }
            }
        }
        // --- END OF BUSINESS LOGIC BLOCK ---

        // Update the order status and who updated it
        const [result] = await connection.query(
            "UPDATE orders SET status = ?, staff_id = ? WHERE order_id = ?", 
            [newStatus, staff_id, id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Order not found or status unchanged");
        }

        // --- ADDED: Create/Update the notification ---
        await createOrUpdateNotification(id, customer_id, newStatus, connection);
        // --- END OF ADDITION ---

        await connection.commit();
        res.json({ message: `Order status updated to ${newStatus}` });

    } catch (error) {
        await connection.rollback();
        if (error.message.startsWith("Not enough stock")) {
            return res.status(400).json({ message: error.message });
        }
        console.error("Error updating order status:", error);
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    } finally {
        connection.release();
    }
};


// @desc    Get kitchen orders (pending, preparing, ready)
// @route   GET /api/orders/kitchen
// @access  Private (Staff)
export const getKitchenOrders = async (req, res) => {
    try {
        const sql = `
            SELECT o.*, c.first_name, c.last_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.status IN ('pending', 'preparing', 'ready')
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
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE o.status = 'served'
            ORDER BY o.order_date DESC
        `;
        const [orders] = await pool.query(sql);
        res.json(orders);
    } catch (error) {
        console.error("Error fetching served orders:", error);
        res.status(500).json({ message: "Error fetching served orders", error: error.message });
    }
};


// --- NEW HELPER FUNCTION TO CREATE NOTIFICATIONS ---
const createOrUpdateNotification = async (order_id, customer_id, status, connection) => {
  // If there's no customer_id (e.g., a POS order), we can't create a notification.
  if (!customer_id) {
    return;
  }

  try {
    // Step 1: Delete any existing notifications for this order.
    // This ensures the customer only sees the *latest* status.
    const deleteSql = "DELETE FROM notifications WHERE order_id = ?";
    await (connection || pool).query(deleteSql, [order_id]);

    // Step 2: Define the message based on the status.
    let title = `Order #${order_id} Updated!`;
    let message = `Your order #${order_id} is now ${status}.`;

    switch (status) {
      case 'pending':
        title = 'Order Placed!';
        message = `Your order #${order_id} is now pending.`;
        break;
      case 'preparing':
        title = 'Order Preparing!';
        message = `Your order #${order_id} is now being prepared.`;
        break;
      case 'ready':
        title = 'Order Ready!';
        message = `Your order #${order_id} is ready for pickup/delivery!`;
        break;
      case 'served':
        title = 'Order On Its Way!';
        message = `Your order #${order_id} is on its way for delivery!`;
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = `Your order #${order_id} has been cancelled.`;
        break;
    }

    // Step 3: Insert the new notification. (It's unread by default)
    const insertSql = `
      INSERT INTO notifications (customer_id, order_id, title, message, is_read)
      VALUES (?, ?, ?, ?, 0)
    `;
    await (connection || pool).query(insertSql, [customer_id, order_id, title, message]);

  } catch (error) {
    // Log the error but don't crash the main transaction
    console.error(`Failed to create notification for order ${order_id}:`, error.message);
  }
};