import pool from "../config/mysql.js";
import { validateStock, adjustStock, logOrderStockChange } from "./itemController.js";

const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%

// Helper function to emit socket events
const emitOrderUpdate = (req, eventName, data) => {
    try {
        const io = req.app.get('io');
        if (io) {
            io.emit(eventName, data);
            console.log(`📡 Socket event emitted: ${eventName}`, data);
        }
    } catch (error) {
        console.error('Failed to emit socket event:', error.message);
    }
};

// @desc    Create a new POS order (cash/staff)
// @route   POST /api/orders/pos
// @access  Private (Staff)
export const createPosOrder = async (req, res) => {
    const connection = await pool.getConnection();
    let order_id; 

    try {
        await connection.beginTransaction();

        // 1. Destructure the new 'customer_name' field
        const { 
          items, order_type, instructions, delivery_location, 
          payment_method, change_amount,
          client_id, table_id, 
          customer_name // <--- NEW FIELD FROM FRONTEND
        } = req.body;

        const [empRows] = await connection.query("SELECT employee_id FROM employees WHERE user_id = ?", [req.user.id]);
        
        if (empRows.length === 0) {
            throw new Error("Staff profile not found for this user.");
        }
        const employee_id = empRows[0].employee_id;
        
        // Step 1: Validate stock
        await validateStock(items, connection);

        // Step 2: Create the order
        // UPDATED SQL: Added 'guest_name' column
        const orderSql = `
            INSERT INTO fb_orders 
            (client_id, guest_name, employee_id, order_type, delivery_location, table_id, status, items_total, service_charge_amount, vat_amount, total_amount) 
            VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, 0)
        `;
        
        // Logic: If client_id is present, use it (App User). If not, use customer_name as guest_name (Walk-in).
        const finalClientId = client_id || null;
        const finalGuestName = !client_id && customer_name ? customer_name : null;

        const [orderResult] = await connection.query(orderSql, [
            finalClientId,
            finalGuestName, // <--- Insert Name "Nicole" here
            employee_id, 
            order_type, 
            delivery_location, // <--- Insert Location "Counter (Take-out)" here
            table_id || null
        ]); 
        order_id = orderResult.insertId;

        // --- Set Table to Occupied (if applicable) ---
        if (table_id) {
            await connection.query(
                "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
                [table_id]
            );
        }
        
        // Step 3: Calculate totals (Logic remains the same)
        let calculatedItemsTotal = 0; 

        for (const item of items) {
            // ... (Price fetching & Promo logic remains same) ...
            const [rows] = await connection.query(
                `SELECT mi.price, p.discount_percentage, p.start_date, p.end_date, p.is_active 
                 FROM fb_menu_items mi
                 LEFT JOIN fb_promotions p ON mi.promotion_id = p.promotion_id
                 WHERE mi.item_id = ?`, 
                [item.item_id]
            );

            if (rows.length === 0) continue;

            const dbItem = rows[0];
            let actualPrice = parseFloat(dbItem.price);

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
            const itemInstructions = item.instructions || instructions || '';
            
            const detailSql = "INSERT INTO fb_order_details (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) VALUES (?, ?, ?, ?, ?, ?)";
            await connection.query(detailSql, [order_id, item.item_id, item.quantity, actualPrice, subtotal, itemInstructions]);
        }

        const calculatedServiceCharge = calculatedItemsTotal * SERVICE_RATE;
        const calculatedVatAmount = (calculatedItemsTotal + calculatedServiceCharge) * VAT_RATE; 
        const calculatedTotalAmount = calculatedItemsTotal + calculatedServiceCharge + calculatedVatAmount;

        await connection.query(
            `UPDATE fb_orders 
             SET items_total = ?, service_charge_amount = ?, vat_amount = ?, total_amount = ? 
             WHERE order_id = ?`,
            [calculatedItemsTotal, calculatedServiceCharge, calculatedVatAmount, calculatedTotalAmount, order_id]
        );
        
        await adjustStock(items, 'deduct', connection);
        await logOrderStockChange(order_id, items, 'ORDER_DEDUCT', connection);

        if (payment_method !== 'Pay Later') {
            const paymentSql = "INSERT INTO fb_payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
            await connection.query(paymentSql, [order_id, payment_method || "Cash", calculatedTotalAmount, change_amount || 0]);
        }

        await connection.commit();

        // Emit Socket Event with Correct Name
        // If it's a guest, send guest_name. If client, fetch their name.
        let firstName = finalGuestName;
        let lastName = '';
        if (finalClientId) {
             const [clientInfo] = await connection.query("SELECT first_name, last_name FROM tbl_client_users WHERE client_id = ?", [finalClientId]);
             if (clientInfo.length > 0) {
                 firstName = clientInfo[0].first_name;
                 lastName = clientInfo[0].last_name;
             }
        }

        emitOrderUpdate(req, 'new-order', {
            order_id,
            order_type,
            table_id,
            delivery_location,
            total_amount: calculatedTotalAmount,
            status: 'pending',
            first_name: firstName,
            last_name: lastName,
            timestamp: new Date()
        });

        // ✅ UPDATE RESPONSE: Return full financial details for the Receipt
        res.status(201).json({
            success: true,
            message: "POS order created successfully",
            order: {
                order_id,
                order_date: new Date(),
                order_type,
                customer_name: finalGuestName || (firstName + ' ' + lastName).trim() || 'Guest',
                delivery_location,
                // Financials
                items_total: calculatedItemsTotal,      // Subtotal
                service_charge: calculatedServiceCharge,
                vat_amount: calculatedVatAmount,
                total_amount: calculatedTotalAmount,
                // Payment Info
                payment_method: payment_method || "Cash",
                amount_tendered: req.body.amount_tendered || 0,
                change_amount: change_amount || 0,
                // Items List (Passed back for convenience)
                items: items // We assume frontend still has the full item details, but sending back is safe
            }
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

        // --- Location Logic ---
        let finalLocation = "";
        let finalTableId = null;
        let finalRoomId = null;

        if (order_type === 'Dine-in' && table_id) {
            finalTableId = table_id;
            const [tables] = await connection.query("SELECT table_number FROM fb_tables WHERE table_id = ?", [table_id]);
            if (tables.length > 0) {
                finalLocation = `Table ${tables[0].table_number}`;
            } else {
                finalLocation = `Table (ID: ${table_id})`;
            }
        }
        else if (order_type === 'Room Dining' && room_id) {
             finalRoomId = room_id;
             const [rooms] = await connection.query("SELECT room_num FROM tbl_rooms WHERE room_id = ?", [finalRoomId]);
             if (rooms.length > 0) {
                 finalLocation = `Room ${rooms[0].room_num}`;
             }
             else {
                finalLocation = "Room (Unknown)";
             }
        }
        else if (delivery_location) {
            finalLocation = delivery_location;
        }

        // --- 1. Create Order ---
        const orderSql = "INSERT INTO fb_orders (client_id, order_type, delivery_location, table_id, room_id, status) VALUES (?, ?, ?, ?, ?, 'pending')";
        const [orderResult] = await connection.query(orderSql, [client_id, order_type, finalLocation, finalTableId, finalRoomId]);
        const order_id = orderResult.insertId;

        if (finalTableId) {
            await connection.query(
                "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
                [finalTableId]
            );
        }
        
        // --- 2. Insert Items & Calculate Totals ---
        let calculatedItemsTotal = 0;

        for (const item of items) {
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
            
            const itemInstructions = item.instructions || instructions || '';
            
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

        // Create Notification
        await createOrUpdateNotification(order_id, client_id, 'pending', connection, req);

        await connection.commit();

        // ================================================================
        // ✅ FAST PATH OPTIMIZATION (Fetch & Emit Full Data)
        // ================================================================
        
        // 1. Fetch the complete order with item names using the existing connection
        // We join 'fb_menu_items' here to get 'item_name' which the Frontend needs
        const [rows] = await connection.query(`
            SELECT 
                o.order_id, 
                o.order_date, 
                o.order_type, 
                o.delivery_location, 
                o.status, 
                o.total_amount,
                COALESCE(c.first_name, o.guest_name) AS first_name,
                COALESCE(c.last_name, '') AS last_name,
                d.order_detail_id, 
                m.item_name, 
                d.quantity, 
                d.instructions
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
            LEFT JOIN fb_order_details d ON o.order_id = d.order_id
            LEFT JOIN fb_menu_items m ON d.item_id = m.item_id
            WHERE o.order_id = ?
        `, [order_id]);

        if (rows.length > 0) {
            // 2. Group the data (Order + Array of Items)
            const fullOrder = {
                order_id: rows[0].order_id,
                order_date: rows[0].order_date,
                order_type: rows[0].order_type,
                delivery_location: rows[0].delivery_location,
                status: rows[0].status,
                total_amount: rows[0].total_amount,
                first_name: rows[0].first_name,
                last_name: rows[0].last_name,
                items: rows.map(r => ({
                    order_detail_id: r.order_detail_id,
                    item_name: r.item_name || 'Unknown Item',
                    quantity: r.quantity,
                    instructions: r.instructions
                }))
            };

            // 3. Emit the FULL object (Frontend won't need to fetch anything extra!)
            emitOrderUpdate(req, 'new-order', fullOrder);
        }

        // --- Table Status Update (Optional) ---
        if (finalTableId) {
            const io = req.app.get('io');
            if (io) {
                io.emit('table-update', {
                    table_id: parseInt(finalTableId),
                    status: 'Occupied'
                });
            }
        }

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
                COALESCE(c.first_name, o.guest_name) AS first_name,
                COALESCE(c.last_name, '') AS last_name
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

        // ✅ FIX: Added COALESCE to check guest_name if client_id is null
        const [orders] = await pool.query(
            `SELECT 
                o.*, 
                COALESCE(c.first_name, o.guest_name) AS first_name,
                COALESCE(c.last_name, '') AS last_name
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
            WHERE o.order_id = ?`,
            [id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: "Order not found" });
        }
        
        const order = orders[0];

        // Fetch Items (No changes needed here)
        const [items] = await pool.query(
            `SELECT 
                mi.item_name, 
                od.quantity, 
                od.price_on_purchase AS price,
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
            first_name: order.first_name, // Now contains "Bentong"
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
        await createOrUpdateNotification(id, client_id, newStatus, connection, req);

        await connection.commit();

        // ✅ NEW: Emit status update to all clients
        emitOrderUpdate(req, 'order-status-updated', {
            order_id: parseInt(id),
            status: newStatus,
            client_id,
            timestamp: new Date()
        });

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

// @desc    Get active kitchen orders (pending/preparing/ready)
// @route   GET /api/orders/kitchen
// @access  Private (Staff)
export const getKitchenOrders = async (req, res) => {
    try {
        const sql = `
            SELECT 
                o.order_id, 
                o.order_date, 
                o.order_type, 
                o.delivery_location, 
                o.status, 
                o.total_amount,
                COALESCE(c.first_name, o.guest_name) AS first_name,
                COALESCE(c.last_name, '') AS last_name,
                d.order_detail_id,       -- Get item details
                m.item_name,             -- Get item name
                d.quantity, 
                d.instructions
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
            LEFT JOIN fb_order_details d ON o.order_id = d.order_id
            LEFT JOIN fb_menu_items m ON d.item_id = m.item_id
            WHERE o.status IN ('pending', 'preparing', 'ready')
            ORDER BY o.order_date ASC
        `;
        
        const [rows] = await pool.query(sql);

        // Group flat rows into nested Order objects
        const ordersMap = new Map();
        
        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    order_id: row.order_id,
                    order_date: row.order_date,
                    order_type: row.order_type,
                    delivery_location: row.delivery_location,
                    status: row.status,
                    total_amount: row.total_amount,
                    first_name: row.first_name,
                    last_name: row.last_name,
                    items: [] // Initialize items array
                });
            }
            
            // Add item to the order if it exists
            if (row.order_detail_id) {
                ordersMap.get(row.order_id).items.push({
                    order_detail_id: row.order_detail_id,
                    item_name: row.item_name || 'Unknown Item',
                    quantity: row.quantity,
                    instructions: row.instructions
                });
            }
        });

        // Convert Map to Array
        res.json(Array.from(ordersMap.values()));

    } catch (error) {
        console.error("Error fetching kitchen orders:", error);
        res.status(500).json({ message: "Error fetching kitchen orders", error: error.message });
    }
};

// @desc    Get served AND cancelled orders (Archived)
// @route   GET /api/orders/served
// @access  Private (Staff)
export const getServedOrders = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // 1. Updated Query: Corrected 'order_detail_id' and added 'fb_menu_items' join
        let sql = `
            SELECT 
                o.*, 
                COALESCE(c.first_name, o.guest_name) AS first_name,
                COALESCE(c.last_name, '') AS last_name,
                d.order_detail_id,       -- ✅ CORRECTED from 'detail_id'
                m.item_name,             -- ✅ Added to get the name of the food
                d.quantity, 
                d.instructions
            FROM fb_orders o
            LEFT JOIN tbl_client_users c ON o.client_id = c.client_id
            LEFT JOIN fb_order_details d ON o.order_id = d.order_id 
            LEFT JOIN fb_menu_items m ON d.item_id = m.item_id  -- ✅ Join to get item name
            WHERE o.status IN ('served', 'cancelled')
        `;

        const params = [];

        // 2. Apply Date Filter
        if (startDate && endDate) {
            sql += ` AND DATE(o.order_date) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        sql += ` ORDER BY o.order_date DESC`;

        const [rows] = await pool.query(sql, params);

        // 3. Grouping Logic (Preserves your original Data Flow)
        const ordersMap = new Map();

        rows.forEach(row => {
            if (!ordersMap.has(row.order_id)) {
                ordersMap.set(row.order_id, {
                    // Copy all main order fields
                    order_id: row.order_id,
                    order_date: row.order_date,
                    status: row.status,
                    order_type: row.order_type,
                    delivery_location: row.delivery_location,
                    total_amount: row.total_amount, 
                    first_name: row.first_name,
                    last_name: row.last_name,
                    // Initialize empty items array
                    items: [] 
                });
            }

            // Only push if there is actually an item (handle empty orders)
            if (row.order_detail_id) {
                ordersMap.get(row.order_id).items.push({
                    detail_id: row.order_detail_id, 
                    item_name: row.item_name || 'Unknown Item', // Fallback if name missing
                    quantity: row.quantity,
                    instructions: row.instructions
                });
            }
        });

        // Convert Map back to Array
        const orders = Array.from(ordersMap.values());

        res.json(orders);
    } catch (error) {
        console.error("Error fetching served orders:", error);
        res.status(500).json({ message: "Error fetching served orders", error: error.message });
    }
};

const createOrUpdateNotification = async (order_id, client_id, status, connection, req) => {
    if (!client_id) {
        return;
    }

    try {
        const deleteSql = `
            DELETE n
            FROM fb_notifications n
            JOIN fb_orders o ON n.order_id = o.order_id
            WHERE n.order_id = ? 
              AND (o.status = 'served' OR n.order_id = ?) 
        `;
        await (connection || pool).query(deleteSql, [order_id, order_id]);

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

        const insertSql = `
            INSERT INTO fb_notifications (client_id, order_id, title, message, is_read)
            VALUES (?, ?, ?, ?, 0)
        `;
        await (connection || pool).query(insertSql, [client_id, order_id, title, message]);

        // ✅ NEW: Emit notification via socket (if req is passed)
        if (req) {
            emitOrderUpdate(req, 'new-notification', {
                client_id,
                order_id,
                title,
                message,
                status,
                is_read: false,
                timestamp: new Date()
            });
        }

    } catch (error) {
        console.error(`Failed to create notification for order ${order_id}:`, error.message);
    }
};

// @desc    Get logged-in user's orders with Rating Status
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        // Validate User
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const client_id = req.user.id; 

        // 1. Fetch Orders
        const [orders] = await pool.query(
            `SELECT * FROM fb_orders 
             WHERE client_id = ? 
             ORDER BY order_date DESC`, 
            [client_id]
        );

        if (orders.length === 0) {
            return res.json([]);
        }

        // 2. Fetch Items & Check Ratings
        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            // Get order details
            const [items] = await pool.query(`
                SELECT * FROM fb_order_details WHERE order_id = ?
            `, [order.order_id]);
            
            // Get Item Name AND Rating Status
            const itemsWithDetails = await Promise.all(items.map(async (item) => {
                 // ✅ MODIFIED QUERY: Fetch Name + Rating in one go
                 // We LEFT JOIN with the ratings table using client_id and item_id
                 const [info] = await pool.query(`
                    SELECT mi.item_name, r.rating_value 
                    FROM fb_menu_items mi
                    LEFT JOIN fb_food_ratings r 
                        ON mi.item_id = r.item_id AND r.client_id = ?
                    WHERE mi.item_id = ?
                 `, [client_id, item.item_id]);

                 return {
                    ...item,
                    item_name: info.length > 0 ? info[0].item_name : 'Unknown Item',
                    // ✅ ADDED: If rating_value exists, send it. Otherwise null.
                    my_rating: (info.length > 0 && info[0].rating_value) ? info[0].rating_value : null
                 };
            }));

            return { ...order, items: itemsWithDetails };
        }));

        res.json(ordersWithItems);

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};