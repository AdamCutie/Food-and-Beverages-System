import pool from "../config/mysql.js";
import crypto from "crypto";

const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Helper: Verify PayMongo Webhook Signature
const verifyPayMongoSignature = (req) => {
    const signatureHeader = req.headers['paymongo-signature'];
    const bodyString = req.body.toString();
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!signatureHeader || !webhookSecret) return false;

    const parts = signatureHeader.split(',');
    let timestamp, liveSignature;

    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 't') timestamp = value;
        if (key === 'li' || key === 'te') liveSignature = value;
    });

    if (!timestamp || !liveSignature) return false;

    const signedPayload = `${timestamp}.${bodyString}`;
    const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

    return computedSignature === liveSignature;
};

// Helper: Determine Location String & Order Type
const resolveOrderLocation = async (connection, table_id, room_id) => {
    let finalLocation = "";
    let orderType = "Takeout";

    if (table_id) {
        orderType = "Dine-in";
        const [tRows] = await connection.query(
            "SELECT table_number FROM fb_tables WHERE table_id = ?", 
            [table_id]
        );

        finalLocation = tRows.length > 0 
            ? `Table ${tRows[0].table_number}` 
            : `Table (ID: ${table_id})`;

        await connection.query(
            "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
            [table_id]
        );
    }
    else if (room_id) {
        orderType = "Room Dining";
        const [rRows] = await connection.query(
            "SELECT room_num FROM tbl_rooms WHERE room_id = ?", 
            [room_id]
        );

        finalLocation = rRows.length > 0 
            ? `Room ${rRows[0].room_num}` 
            : `Room (ID: ${room_id})`;
    } 
    else {
        // 🔥 FIX THIS: Add Takeout Location
        finalLocation = "Takeout Counter";
    }

    return { finalLocation, orderType };
};

// ==========================================
// CONTROLLERS
// ==========================================

// @desc    Create order and PayMongo payment link (NO DB insertion yet)
// @route   POST /api/orders/checkout
// @access  Customer
export const createPayMongoPayment = async (req, res) => {
    try {
        const { cart_items, table_id, room_id, special_instructions } = req.body;
        const client_id = req.user.id;

        // 1. Validation
        if (!cart_items || cart_items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 2. Calculate Totals & Build Items
        let itemsTotal = 0;
        const orderItemsData = [];

        for (const item of cart_items) {
            // Fetch fresh price from DB to prevent tampering
            const [menuItem] = await pool.query("SELECT item_name, price FROM fb_menu_items WHERE item_id = ?", [item.item_id]);

            if (menuItem.length === 0) {
                return res.status(404).json({ message: `Item ${item.item_id} not found` });
            }

            const price = parseFloat(menuItem[0].price);
            itemsTotal += price * item.quantity;

            orderItemsData.push({
                item_id: item.item_id,
                item_name: menuItem[0].item_name,
                quantity: item.quantity,
                price_on_purchase: price,
                instructions: item.instructions || ''
            });
        }

        // 3. Tax & Service Charge Calculation
        const serviceCharge = itemsTotal * SERVICE_RATE;
        const subtotalWithService = itemsTotal + serviceCharge;
        const vatAmount = subtotalWithService * VAT_RATE;
        const totalAmount = subtotalWithService + vatAmount;

        // 4. Build PayMongo Line Items
        const line_items = [
            ...orderItemsData.map(item => ({
                name: item.item_name,
                quantity: item.quantity,
                amount: Math.round(item.price_on_purchase * 100),
                currency: 'PHP'
            })),
            {
                name: "Service Charge (10%)",
                quantity: 1,
                amount: Math.round(serviceCharge * 100),
                currency: 'PHP'
            },
            {
                name: "VAT (12%)",
                quantity: 1,
                amount: Math.round(vatAmount * 100),
                currency: 'PHP'
            }
        ];

        // 5. Prepare Metadata (Strings only)
        const orderMetadata = {
            client_id: client_id.toString(),
            table_id: table_id ? table_id.toString() : '',
            room_id: room_id ? room_id.toString() : '',
            special_instructions: special_instructions || '',
            items_total: itemsTotal.toFixed(2),
            service_charge_amount: serviceCharge.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            order_items: JSON.stringify(orderItemsData)
        };

        // 6. Call PayMongo API
        const paymongoResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        line_items,
                        payment_method_types: ['gcash', 'card', 'paymaya', 'grab_pay'],
                        success_url: `${process.env.FRONTEND_URL}/payment-success?`,
                        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
                        description: `Food & Beverages Order`,
                        show_line_items: true,
                        metadata: orderMetadata
                    }
                }
            })
        });

        const paymongoData = await paymongoResponse.json();

        if (!paymongoResponse.ok) {
            throw new Error(paymongoData.errors?.[0]?.detail || "PayMongo API error");
        }

        res.json({
            checkout_url: paymongoData.data.attributes.checkout_url,
            payment_link_id: paymongoData.data.id,
            reference_number: paymongoData.data.attributes.reference_number
        });

    } catch (error) {
        console.error('Create Checkout Error:', error);
        res.status(500).json({ message: "Failed to create checkout", error: error.message });
    }
};

// @desc    PayMongo Webhook Handler - CREATES order after payment
// @route   POST /api/payments/webhook
// @access  Public (verified by signature)
export const paymongoWebhook = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        // 1. Verify Signature
        if (!verifyPayMongoSignature(req)) {
            console.error("❌ Invalid PayMongo Signature");
            return res.status(401).json({ message: "Invalid signature" });
        }

        const event = JSON.parse(req.body.toString());

        // We only care about successful payments
        if (event.data.attributes.type !== 'payment.paid') {
            return res.status(200).json({ message: "Event ignored (not payment.paid)" });
        }

        await connection.beginTransaction();

        const paymentData = event.data.attributes.data;
        const paymongo_payment_id = paymentData.id;
        const metadata = paymentData.attributes.metadata;

        // 2. Idempotency Check (Prevent duplicates)
        const [existing] = await connection.query("SELECT payment_id FROM fb_payments WHERE paymongo_payment_id = ?", [paymongo_payment_id]);
        if (existing.length > 0) {
            await connection.commit();
            return res.status(200).json({ message: "Order already processed" });
        }

        // 3. Extract & Clean Data
        const client_id = metadata.client_id;
        const table_id = (metadata.table_id && metadata.table_id !== "") ? parseInt(metadata.table_id) : null;
        const room_id = (metadata.room_id && metadata.room_id !== "") ? parseInt(metadata.room_id) : null;

        // 4. Resolve Location (Table X or Room Y) using Helper
        const { finalLocation, orderType } = await resolveOrderLocation(connection, table_id, room_id);

        // 5. Parse Financials & Items
        const items_total = parseFloat(metadata.items_total || 0);
        const service_charge_amount = parseFloat(metadata.service_charge_amount || 0);
        const vat_amount = parseFloat(metadata.vat_amount || 0);
        const total_amount = parseFloat(metadata.total_amount || 0);
        
        let order_items = [];
        try {
            order_items = JSON.parse(metadata.order_items || "[]");
        } catch (e) { console.error("Error parsing items metadata", e); }

        // 6. Insert Order
        const orderSql = `
            INSERT INTO fb_orders 
            (client_id, table_id, room_id, delivery_location, order_type, items_total, service_charge_amount, 
             vat_amount, total_amount, special_instructions, status, order_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;
        const [orderResult] = await connection.query(orderSql, [
            client_id, table_id, room_id, finalLocation, orderType,
            items_total, service_charge_amount, vat_amount, total_amount, 
            metadata.special_instructions || null
        ]);
        const new_order_id = orderResult.insertId;

        // 7. Insert Order Details
        if (order_items.length > 0) {
            const detailSql = "INSERT INTO fb_order_details (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) VALUES ?";
            const detailValues = order_items.map(item => [
                new_order_id, item.item_id, item.quantity, item.price_on_purchase, 
                (item.quantity * item.price_on_purchase), item.instructions || ''
            ]);
            await connection.query(detailSql, [detailValues]);
        }

        // 8. Insert Payment Record
        await connection.query(
            "INSERT INTO fb_payments (order_id, payment_method, amount, payment_status, paymongo_payment_id, payment_date) VALUES (?, ?, ?, 'paid', ?, NOW())",
            [new_order_id, paymentData.attributes.source?.type || 'paymongo', total_amount, paymongo_payment_id]
        );

        // 9. Fetch Customer Name (For Socket Notification)
        const [clientRows] = await connection.query("SELECT first_name, last_name FROM tbl_client_users WHERE client_id = ?", [client_id]);
        const clientInfo = clientRows[0] || { first_name: 'Guest', last_name: 'User' };

        await connection.commit();

        // 10. Emit Socket Events
        const io = req.app.get('io');
        if (io) {
            // Notify Kitchen/Staff
            io.emit('new-order', {
                order_id: new_order_id,
                order_type: orderType,
                delivery_location: finalLocation,
                status: 'pending',
                total_amount,
                first_name: clientInfo.first_name,
                last_name: clientInfo.last_name,
                items: order_items,
                order_date: new Date().toISOString(),
                timestamp: new Date()
            });

            // Update Table Map (if dine-in)
            if (table_id) {
                io.emit('table-update', { table_id: parseInt(table_id), status: 'Occupied' });
            }
            console.log(`✅ Webhook success. Order #${new_order_id} created.`);
        }

        res.status(200).json({ message: "Order created", order_id: new_order_id });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Webhook Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Record a new payment (for cash/manual payments)
// @route   POST /api/payments
// @access  Cashier/Admin
export const recordPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { order_id, payment_method, amount, change_amount } = req.body;
        
        if(!order_id || !amount) {
            return res.status(400).json({ message: "Order ID and amount are required."});
        }

        await connection.beginTransaction();

        // Insert Payment
        const paymentSql = "INSERT INTO fb_payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
        const [paymentResult] = await connection.query(paymentSql, [order_id, payment_method, amount, change_amount || 0]);

        // Update Order Status
        await connection.query("UPDATE fb_orders SET status = 'paid' WHERE order_id = ?", [order_id]);

        await connection.commit();
        res.status(201).json({ payment_id: paymentResult.insertId, message: "Payment recorded successfully" });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ message: "Failed to record payment", error: error.message });
    } finally {
        connection.release();
    }
};

// @desc    Get payments for an order
// @route   GET /api/payments/:order_id
// @access  Staff/Admin
export const getPaymentsForOrder = async (req, res) => {
    try {
        const [payments] = await pool.query("SELECT * FROM fb_payments WHERE order_id = ?", [req.params.order_id]);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments", error: error.message });
    }
};