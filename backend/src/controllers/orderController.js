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

        // ... (Step 3: Create the order is unchanged)
        const orderSql = `
            INSERT INTO orders 
            (customer_id, staff_id, order_type, delivery_location, status, items_total, service_charge_amount, vat_amount, total_amount) 
            VALUES (NULL, ?, ?, ?, 'Pending', ?, ?, ?, ?)
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

// ... (createOrder function is unchanged) ...
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { customer_id, items, order_type, instructions, delivery_location } = req.body;

        if (!customer_id || !items || items.length === 0 || !delivery_location) {
            throw new Error("Missing required order information.");
        }
        
        const orderSql = "INSERT INTO orders (customer_id, order_type, delivery_location, status) VALUES (?, ?, ?, 'Pending')";
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
    try {
        // --- THIS IS THE FIX ---
        // We now JOIN the customers table to get the name
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
        // --- END OF FIX ---

        res.json(orders);
    } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ message: "Error fetching orders", error: error.message });
    }
};

// ... (getOrderById function is unchanged) ...
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

    const [items] = await pool.query(
    `SELECT mi.item_name, od.quantity, mi.price 
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


// --- THIS IS THE MODIFIED FUNCTION ---
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; 
    const connection = await pool.getConnection();
    
    // 1. GET THE STAFF ID FROM THE REQUEST
    // This only works because we added the 'protect' middleware in orderRoutes.js
    const staff_id = req.user.id;

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query("SELECT status FROM orders WHERE order_id = ? FOR UPDATE", [id]);
        if (orders.length === 0) {
            throw new Error("Order not found");
        }
        const currentStatus = orders[0].status;

        // 2. MODIFY THE 'PREPARING' LOGIC
        if (status.toLowerCase() === 'preparing' && currentStatus === 'pending') {
            const [details] = await connection.query("SELECT item_id, quantity FROM order_details WHERE order_id = ?", [id]);
            
            await validateStock(details, connection);
            
            await adjustStock(details, 'deduct', connection);
            await logOrderStockChange(id, details, 'ORDER_DEDUCT', connection);
            console.log(`Ingredient stock deducted and logged for order ${id}`);

            // 3. ADD THIS SQL QUERY
            // This is the new logic to assign the staff member to the order
            await connection.query(
                "UPDATE orders SET status = ?, staff_id = ? WHERE order_id = ?", 
                [status, staff_id, id]
            );

        }
        // 4. MODIFY THE 'ELSE' BLOCK
        else if (status.toLowerCase() === 'cancelled') {
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
            // Update status separately for cancellation
            const [result] = await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
            if (result.affectedRows === 0) {
                throw new Error("Order not found");
            }

        } else {
            // This handles all other status changes (e.g., Ready -> Served)
            // It does NOT update the staff_id, only the status.
            const [result] = await connection.query("UPDATE orders SET status = ? WHERE order_id = ?", [status, id]);
            if (result.affectedRows === 0) {
                throw new Error("Order not found");
            }
        }
        // --- END OF MODIFICATION ---

        await connection.commit();
        res.json({ message: `Order status updated to ${status}` });

    } catch (error) {
        await connection.rollback();
        if (error.message.startsWith("Not enough stock")) {
            console.error(`Stock validation failed for order ${id}: ${error.message}`);
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    } finally {
        connection.release();
    }
};
// --- END OF MODIFIED FUNCTION ---


// ... (getKitchenOrders and getServedOrders are unchanged) ...
export const getKitchenOrders = async (req, res) => {
    try {
        const sql = `
            SELECT o.*, c.first_name, c.last_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
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

export const getServedOrders = async (req, res) => {
    try {
        const sql = `
            SELECT o.*, c.first_name, c.last_name
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
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