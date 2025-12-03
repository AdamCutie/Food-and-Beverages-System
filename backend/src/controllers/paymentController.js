import pool from "../config/mysql.js";
import crypto from "crypto";

const SERVICE_RATE = 0.10; // 10%
const VAT_RATE = 0.12;     // 12%

// ==========================================
// 🛠️ HELPER FUNCTIONS (Fixed)
// ==========================================

/**
 * Validates the PayMongo Webhook Signature
 * Checks for req.rawBody (from server.js) or req.body (Buffer)
 */
const validateWebhookSignature = (req) => {
    // 1. Retrieve the Raw Body (Buffer)
    let rawBody;
    
    // Check Strategy A (Global verify middleware)
    if (req.rawBody) {
        rawBody = req.rawBody; 
    } 
    // Check Strategy B (Route-specific express.raw middleware)
    else if (Buffer.isBuffer(req.body)) {
        rawBody = req.body;    
    } 
    else {
        throw new Error("Server misconfiguration: Raw body missing. Check server.js");
    }

    const signatureHeader = req.headers['paymongo-signature'];
    if (!signatureHeader) throw new Error("Missing signature header");

    // 2. Extract Timestamp and Signature
    const parts = signatureHeader.split(',');
    let timestamp, liveSignature, testSignature;

    parts.forEach(part => {
        const [key, value] = part.split('=');
        if (key === 't') timestamp = value;
        if (key === 'li') liveSignature = value;
        if (key === 'te') testSignature = value;
    });

    const signatureToMatch = liveSignature || testSignature;
    if (!timestamp || !signatureToMatch) throw new Error("Invalid signature format");

    // 3. Verify Hash
    const signedPayload = `${timestamp}.${rawBody.toString()}`;
    const computedSignature = crypto
        .createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET)
        .update(signedPayload)
        .digest('hex');

    if (computedSignature !== signatureToMatch) {
        throw new Error("Signature mismatch");
    }

    // 4. Return Parsed Event
    return JSON.parse(rawBody.toString());
};

/**
 * Extracts and cleans order data from PayMongo Metadata
 * (This was missing in your file)
 */
const parseOrderMetadata = (metadata) => {
    const table_id = metadata.table_id ? parseInt(metadata.table_id) : null;
    const room_id = metadata.room_id ? parseInt(metadata.room_id) : null;

    // Determine Location String
    let locationString = "Takeout";
    if (table_id) locationString = `Table ${table_id}`;
    if (room_id) locationString = `Room ${room_id}`;

    // Safe JSON Parse for items
    let order_items = [];
    try {
        if (typeof metadata.order_items === 'string') {
            order_items = JSON.parse(metadata.order_items);
        }
    } catch (e) { 
        console.error("Error parsing order_items:", e); 
    }

    return {
        client_id: metadata.client_id,
        table_id,
        room_id,
        locationString,
        special_instructions: metadata.special_instructions || null,
        items_total: parseFloat(metadata.items_total || 0),
        service_charge_amount: parseFloat(metadata.service_charge_amount || 0),
        vat_amount: parseFloat(metadata.vat_amount || 0),
        total_amount: parseFloat(metadata.total_amount || 0),
        order_items
    };
};

// ==========================================
// CONTROLLERS
// ==========================================

// @desc    Create order and PayMongo payment link
// @route   POST /api/orders/checkout
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

        // 5. Prepare Metadata
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
export const paymongoWebhook = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        // 1. Security Check & Parsing
        let event;
        try {
            // ✅ Calls the correct helper function we defined above
            event = validateWebhookSignature(req);
        } catch (err) {
            console.error(`❌ Webhook Security Error: ${err.message}`);
            return res.status(401).json({ message: err.message });
        }

        // 2. Handle Event Type
        const eventType = event.data.attributes.type;

        if (eventType === 'payment.failed') {
            console.log('⚠️ Payment failed event received.');
            return res.status(200).json({ message: "Payment failed acknowledged" });
        }

        if (eventType !== 'payment.paid') {
            return res.status(200).json({ message: "Event ignored" });
        }

        // 3. Process Successful Payment
        await connection.beginTransaction();

        const paymentData = event.data.attributes.data;
        const paymongo_payment_id = paymentData.id;
        
        // A. Idempotency Check
        const [existing] = await connection.query(
            "SELECT 1 FROM fb_payments WHERE paymongo_payment_id = ?", 
            [paymongo_payment_id]
        );

        if (existing.length > 0) {
            await connection.commit();
            return res.status(200).json({ message: "Order already processed" });
        }

        // B. Prepare Data using the Helper
        // ✅ Calls the helper function we added to this file
        const orderData = parseOrderMetadata(paymentData.attributes.metadata);

        // C. Insert Order
        const orderSql = `
            INSERT INTO fb_orders 
            (client_id, table_id, room_id, delivery_location, items_total, service_charge_amount, 
             vat_amount, total_amount, special_instructions, status, order_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `;
        
        const [orderResult] = await connection.query(orderSql, [
            orderData.client_id, orderData.table_id, orderData.room_id, orderData.locationString,
            orderData.items_total, orderData.service_charge_amount, orderData.vat_amount, 
            orderData.total_amount, orderData.special_instructions
        ]);

        const new_order_id = orderResult.insertId;

        // D. Insert Order Details (Bulk)
        if (orderData.order_items.length > 0) {
            const detailsSql = `
                INSERT INTO fb_order_details 
                (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) 
                VALUES ?`;
            
            const detailValues = orderData.order_items.map(item => [
                new_order_id,
                item.item_id,
                item.quantity,
                item.price_on_purchase,
                (item.quantity * item.price_on_purchase),
                item.instructions || ''
            ]);
            
            await connection.query(detailsSql, [detailValues]);
        }

        // E. Insert Payment Record
        await connection.query(`
            INSERT INTO fb_payments 
            (order_id, payment_method, amount, payment_status, paymongo_payment_id, payment_date) 
            VALUES (?, ?, ?, 'paid', ?, NOW())`, 
            [new_order_id, paymentData.attributes.source?.type || 'paymongo', orderData.total_amount, paymongo_payment_id]
        );

        // F. Get Client Info
        const [clientRows] = await connection.query(
            "SELECT first_name, last_name FROM tbl_client_users WHERE client_id = ?", 
            [orderData.client_id]
        );
        const clientInfo = clientRows[0] || { first_name: 'Guest', last_name: '' };

        // ==========================================
        // 🔥 G. UPDATE TABLE / ROOM STATUS (Restored)
        // ==========================================
        
        // 1. If it's a Table Order, set table to Occupied
        if (orderData.table_id) {
            await connection.query(
                "UPDATE fb_tables SET status = 'Occupied' WHERE table_id = ?", 
                [orderData.table_id]
            );
            console.log(`🪑 Table ${orderData.table_id} updated to Occupied`);
        } 
        
        // 2. If it's a Room Order, set room to Occupied (If applicable)
        // (I assumed the table name is tbl_rooms and column is status based on your previous code)
        else if (orderData.room_id) {
            await connection.query(
                "UPDATE tbl_rooms SET status = 'Occupied' WHERE room_id = ?", 
                [orderData.room_id]
            );
            console.log(`🏨 Room ${orderData.room_id} updated to Occupied`);
        }

        // ==========================================

        await connection.commit();

        // 4. Real-time Notification
        const io = req.app.get('io');
        if (io) {
            io.emit('new-order', {
                order_id: new_order_id,
                delivery_location: orderData.locationString,
                status: 'pending',
                total_amount: orderData.total_amount,
                first_name: clientInfo.first_name,
                last_name: clientInfo.last_name,
                items: orderData.order_items,
                order_date: new Date(),
                timestamp: new Date()
            });
            console.log(`✅ Order #${new_order_id} processed & notified.`);
        }

        res.status(200).json({ message: "Order created", order_id: new_order_id });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Webhook Processing Error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (connection) connection.release();
    }
};

// @desc    Record a new payment (for cash/manual payments)
// @route   POST /api/payments
export const recordPayment = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { order_id, payment_method, amount, change_amount } = req.body;
        
        if(!order_id || !amount) {
            return res.status(400).json({ message: "Order ID and amount are required."});
        }

        await connection.beginTransaction();

        const paymentSql = "INSERT INTO fb_payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
        const [paymentResult] = await connection.query(paymentSql, [order_id, payment_method, amount, change_amount || 0]);

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
export const getPaymentsForOrder = async (req, res) => {
    try {
        const [payments] = await pool.query("SELECT * FROM fb_payments WHERE order_id = ?", [req.params.order_id]);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments", error: error.message });
    }
};