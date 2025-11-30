import pool from "../config/mysql.js";
import { validateStock, adjustStock, logOrderStockChange } from "./itemController.js";

const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%


// @desc    Create a new POS order (cash/staff)
// @route   POST /api/orders/pos
// @access  Private (Staff)
export const createPosOrder = async (req, res) => {
    const connection = await pool.getConnection();
    // Move order_id declaration here so it's available in catch block if needed (optional)
    let order_id; 

    try {
        await connection.beginTransaction();

        // --- 1. GET NEW FIELDS FROM req.body ---
        // UPDATED: Added client_id and table_id to destructuring
        const { 
          items, order_type, instructions, delivery_location, 
          payment_method, change_amount,
          client_id, table_id 
        } = req.body;

        const [empRows] = await connection.query("SELECT employee_id FROM employees WHERE user_id = ?", [req.user.id]);
        
        if (empRows.length === 0) {
            throw new Error("Staff profile not found for this user.");
        }
        const employee_id = empRows[0].employee_id;
        
        // Step 1: Validate stock
        await validateStock(items, connection);

        // Step 2: Create the order
        // We set totals to 0 initially, they are updated in Step 3
        const orderSql = "INSERT INTO fb_orders (client_id, employee_id, order_type, delivery_location, table_id, status, items_total, service_charge_amount, vat_amount, total_amount) VALUES (?, ?, ?, ?, ?, 'pending', 0, 0, 0, 0)";
        
        // UPDATED: Use client_id || null, fixed delivery_location variable name
        const [orderResult] = await connection.query(orderSql, [
            client_id || null, 
            employee_id, 
            order_type, 
            delivery_location, 
            table_id || null
        ]); 
        order_id = orderResult.insertId; // Assign to the outer variable

        // --- NEW LOGIC: Set Table to Occupied ---
        if (table_id) {
            await connection.query(
                "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
                [table_id]
            );
        }
        
        // Step 3: Calculate totals and create order details
        let calculatedItemsTotal = 0; 

        for (const item of items) {
            // 1. Fetch the item's price AND promo details
            const [rows] = await connection.query(
                `SELECT 
                    mi.price, 
                    p.discount_percentage, 
                    p.start_date, 
                    p.end_date, 
                    p.is_active 
                 FROM fb_menu_items mi
                 LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
                 WHERE mi.item_id = ?`, 
                [item.item_id]
            );

            if (rows.length === 0) continue; // Skip if item not found

            const dbItem = rows[0];
            let actualPrice = parseFloat(dbItem.price); // Start with the original price

            // 2. Check if the promo is active and valid
            if (dbItem.discount_percentage && dbItem.is_active) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const startDate = new Date(dbItem.start_date);
                const endDate = new Date(dbItem.end_date);
                
                if (today >= startDate && today <= endDate) { 
                    const discount = parseFloat(dbItem.discount_percentage) / 100;
                    actualPrice = actualPrice * (1 - discount); 
                }
            }
            
            // 3. Use the new 'actualPrice' for all calculations
            const subtotal = actualPrice * item.quantity;
            calculatedItemsTotal += subtotal;
   
            const itemInstructions = item.instructions || instructions || '';
            
            // UPDATED: Insert 'actualPrice' into 'price_on_purchase'
            const detailSql = "INSERT INTO fb_order_details (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) VALUES (?, ?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, actualPrice, subtotal, itemInstructions]);
        }

        // Calculate service charge and VAT
        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        // Step 3.1: Update order with calculated totals
        await connection.query(
            `UPDATE fb_orders 
             SET items_total = ?, service_charge_amount = ?, vat_amount = ?, total_amount = ? 
             WHERE order_id = ?`,
            [calculatedItemsTotal, calculatedServiceCharge, calculatedVatAmount, calculatedTotalAmount, order_id]
        );
        
        // Step 4: Deduct stock
        await adjustStock(items, 'deduct', connection);
        
        // Step 5: Log the stock deduction
        await logOrderStockChange(order_id, items, 'ORDER_DEDUCT', connection);

        // Step 6: Record payment
        if (payment_method !== 'Pay Later') {
            const paymentSql =
                "INSERT INTO fb_payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
            await connection.query(paymentSql, [
                order_id,
                payment_method || "Cash",
                calculatedTotalAmount,
                change_amount || 0
            ]);
        } else {
             // Optional: Log that this is a Pay Later order
             console.log(`Order ${order_id} created as Pay Later (Unpaid)`);
        }

        await connection.commit();

        res.status(201).json({
            order_id,
            total_amount: calculatedTotalAmount,
            message: "POS order created successfully"
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("CREATE POS ORDER ERROR:", error);
        if (error.message.startsWith("Not enough stock")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Failed to create order", error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Create a new order (customer)
// @route   POST /api/orders
// @access  Private (Customer)
export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const client_id = req.user.id; 
        const { items, order_type, delivery_location, table_id, room_id, instructions } = req.body;

        if (!items || items.length === 0) {
            throw new Error("Missing required order information.");
        }

        // --- LOGIC: Handle Table ID vs Text Location ---
        let finalLocation = delivery_location;
        let finalTableId = null;
        let finalRoomId = null;

        if (order_type === 'Dine-in' && table_id) {
            finalTableId = table_id;
            const [tables] = await connection.query("SELECT table_number FROM fb_tables WHERE table_id = ?", [table_id]);
            if (tables.length > 0) {
                finalLocation = `Table ${tables[0].table_number}`;
            }
        }

        if (order_type === 'Room Dining' && req.body.room_id) {
             finalRoomId = req.body.room_id;
             const [rooms] = await connection.query("SELECT room_num FROM tbl_rooms WHERE room_id = ?", [finalRoomId]);
             if (rooms.length > 0) {
                 finalLocation = `Room ${rooms[0].room_num}`;
             }
        }
        // ------------------------------------------------

        const orderSql = "INSERT INTO fb_orders (client_id, order_type, delivery_location, table_id, room_id, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        const [orderResult] = await connection.query(orderSql, [client_id, order_type, finalLocation, finalTableId, finalRoomId]);
        const order_id = orderResult.insertId;

        // --- NEW LOGIC: Set Table to Occupied ---
        if (finalTableId) {
            await connection.query(
                "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
                [finalTableId]
            );
        }
        
        let calculatedItemsTotal = 0;

        for (const item of items) {
            // 1. Fetch price & promo details
            const [rows] = await connection.query(
                `SELECT 
                    mi.price, 
                    p.discount_percentage, 
                    p.start_date, 
                    p.end_date, 
                    p.is_active 
                 FROM fb_menu_items mi
                 LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
                 WHERE mi.item_id = ?`, 
                [item.item_id]
            );
            const dbItem = rows[0];
            let actualPrice = parseFloat(dbItem.price); 

            // 2. Apply promo logic
            if (dbItem.discount_percentage && dbItem.is_active) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                const startDate = new Date(dbItem.start_date);
                const endDate = new Date(dbItem.end_date);
                
                if (today >= startDate && today <= endDate) { 
                    const discount = parseFloat(dbItem.discount_percentage) / 100;
                    actualPrice = actualPrice * (1 - discount); 
                }
            }
            
            const subtotal = actualPrice * item.quantity;
            calculatedItemsTotal += subtotal;
            
            // Item instructions fallback
            const itemInstructions = item.instructions || instructions || '';
            
            // UPDATED: Insert 'actualPrice' into 'price_on_purchase'
            const detailSql = "INSERT INTO fb_order_details (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) VALUES (?, ?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, actualPrice, subtotal, itemInstructions]);
        }

        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        const updateSql = `
            UPDATE fb_orders 
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

        // Create notification
        await createOrUpdateNotification(order_id, client_id, 'pending', connection);

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
        const sql = `
            SELECT 
                o.*,
                c.first_name,
                c.last_name
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
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
    try {
        const { id } = req.params;

        const [orders] = await pool.query(
            `SELECT 
                o.*, 
                c.first_name, 
                c.last_name
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
            WHERE o.order_id = ?`,
            [id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const order = orders[0];

        // BUG FIX #5: Remove detail_id alias that doesn't match frontend expectations
        // WHY: Frontend might expect order_detail_id consistently
        // HOW: Use the actual column name without alias for clarity
        const [items] = await pool.query(
            `SELECT 
                mi.item_name, 
                od.quantity, 
                od.price_on_purchase AS price, -- UPDATED: Fetch the frozen price from purchase time
                od.subtotal,
                od.instructions,
                od.order_detail_id
            FROM fb_order_details od 
            JOIN fb_menu_items mi ON od.item_id = mi.item_id 
            WHERE od.order_id = ?`,
            [id]
        );

        const [payments] = await pool.query("SELECT * FROM fb_payments WHERE order_id = ?", [id]);
        const payment = payments[0] || {};

        res.json({
            order_id: order.order_id,
            order_date: order.order_date,
            order_type: order.order_type,
            delivery_location: order.delivery_location,
            first_name: order.first_name,
            last_name: order.last_name,
            items_total: order.items_total,
            service_charge_amount: order.service_charge_amount,
            vat_amount: order.vat_amount,
            total_price: order.total_amount,
            status: order.status,
            items,
            payment_method: payment.payment_method || "PayMongo",
            payment_status: payment.payment_status || "pending",
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
    
    const [empRows] = await pool.query("SELECT employee_id FROM employees WHERE user_id = ?", [req.user.id]);
    if (empRows.length === 0) {
         connection.release();
         return res.status(403).json({ message: "Staff profile not found." });
    }
    const employee_id = empRows[0].employee_id;
    const newStatus = status.toLowerCase();

    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
        // BUG FIX #6: Release connection before returning
        // WHY: Prevents connection leak when validation fails
        // HOW: Release connection in all early return paths
        connection.release();
        return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    try {
        await connection.beginTransaction();

        const [orders] = await connection.query("SELECT status, client_id FROM fb_orders WHERE order_id = ? FOR UPDATE", [id]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: "Order not found" });
        }
        
        const currentStatus = orders[0].status;
        const client_id = orders[0].client_id;

        if (currentStatus === newStatus) {
            await connection.rollback();
            return res.status(400).json({ message: `Order is already ${newStatus}` });
        }

        // BUSINESS LOGIC: Stock management based on status transitions
        if (newStatus === 'preparing' && currentStatus === 'pending') {
            console.log(`Deducting stock for order ${id}...`);
            const [details] = await connection.query("SELECT item_id, quantity FROM fb_order_details WHERE order_id = ?", [id]);
            
            await validateStock(details, connection);
            await adjustStock(details, 'deduct', connection);
            await logOrderStockChange(id, details, 'ORDER_DEDUCT', connection);
            console.log(`Ingredient stock deducted and logged for order ${id}`);

        } else if (newStatus === 'cancelled') {
            // BUG FIX #7: Only restore stock if order was preparing/ready AND not paid
            // WHY: Prevents incorrect stock restoration for already-paid orders
            // HOW: Check both status and payment status before restoring stock
            if (currentStatus === 'preparing' || currentStatus === 'ready') {
                const [payments] = await connection.query(
                    "SELECT * FROM fb_payments WHERE order_id = ? AND payment_status = 'paid'", 
                    [id]
                );

                if (payments.length > 0) {
                    console.warn(`Order ${id} was already paid. Stock NOT restored (requires manual inventory adjustment).`);
                } else {
                    console.log(`Restoring ingredient stock for cancelled unpaid order: ${id}`);
                    const [details] = await connection.query("SELECT item_id, quantity FROM fb_order_details WHERE order_id = ?", [id]);
                    
                    await adjustStock(details, 'restore', connection);
                    await logOrderStockChange(id, details, 'ORDER_RESTORE', connection);
                }
            }
        }

        // Update the order status
        const [result] = await connection.query(
            "UPDATE fb_orders SET status = ?, employee_id = ? WHERE order_id = ?", 
            [newStatus, employee_id, id]
        );

        if (result.affectedRows === 0) {
            throw new Error("Order not found or status unchanged");
        }

        // Create/Update the notification
        await createOrUpdateNotification(id, client_id, newStatus, connection);

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
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
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
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
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

// Helper function to create/update notifications
const createOrUpdateNotification = async (order_id, client_id, status, connection) => {
    if (!client_id) {
        return;
    }

    try {
        // --- 1. NEW LOGIC: Only allow deletion for 'served' orders OR 
        //    if the notification is for the order currently being updated (to prevent duplicates) ---
        
        // This query deletes any notification associated with this specific order_id 
        // IF the order's status is 'served'. This ensures 'served' notifications are 
        // eligible for deletion (e.g., via the Clear All button in NotificationPanel.jsx, 
        // which will call an endpoint that ultimately runs this logic for served orders).
        // It also deletes the existing notification for the current order_id 
        // *before* inserting the new one, regardless of status, which is necessary 
        // to prevent duplicate notifications for the same order_id/status update.

        const deleteSql = `
            DELETE n
            FROM fb_notifications n
            JOIN fb_orders o ON n.order_id = o.order_id
            WHERE n.order_id = ? 
              AND (o.status = 'served' OR n.order_id = ?) 
        `;
        // The second 'n.order_id = ?' ensures the *current* notification for this order_id 
        // is always deleted before a new one is created, preventing duplicate notifications 
        // for the same order when its status changes.
        await (connection || pool).query(deleteSql, [order_id, order_id]);
        
        // --- END NEW LOGIC ---

        // Define message based on status
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

        // Insert new notification
        const insertSql = `
            INSERT INTO fb_notifications (client_id, order_id, title, message, is_read)
            VALUES (?, ?, ?, ?, 0)
        `;
        await (connection || pool).query(insertSql, [client_id, order_id, title, message]);

    } catch (error) {
        console.error(`Failed to create notification for order ${order_id}:`, error.message);
    }
};