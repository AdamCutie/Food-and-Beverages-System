import pool from "../config/mysql.js";
import crypto from "crypto";

// @desc    Create order and PayMongo payment link (NO DB insertion yet)
// @route   POST /api/orders/checkout
// @access  Customer
export const createPayMongoPayment = async (req, res) => {
    try {
        // 1. Accept BOTH table_id and room_id
        const { cart_items, table_id, room_id, special_instructions } = req.body;
        const client_id = req.user.id;

        console.log(`Creating PayMongo checkout for Client ${client_id} | Table: ${table_id || 'N/A'} | Room: ${room_id || 'N/A'}`);

        // 2. Validate cart items
        if (!cart_items || cart_items.length === 0) {
            return res.status(400).json({ message: "Cart is empty" });
        }

        // 3. Calculate totals and build order items
        let itemsTotal = 0;
        const orderItemsData = [];

        for (const item of cart_items) {
            const [menuItem] = await pool.query(
                "SELECT * FROM fb_menu_items WHERE item_id = ?",
                [item.item_id]
            );

            if (menuItem.length === 0) {
                return res.status(404).json({ message: `Item ${item.item_id} not found` });
            }

            const price = parseFloat(menuItem[0].price);
            const subtotal = price * item.quantity;
            itemsTotal += subtotal;

            orderItemsData.push({
                item_id: item.item_id,
                item_name: menuItem[0].item_name,
                quantity: item.quantity,
                price_on_purchase: price,
                instructions: item.instructions || '' // <--- ADD THIS LINE
            });
        }

        // 4. Calculate service charge and VAT
        const serviceCharge = itemsTotal * 0.10;
        const subtotalWithService = itemsTotal + serviceCharge;
        const vatAmount = subtotalWithService * 0.12;
        const totalAmount = subtotalWithService + vatAmount;

        // 5. Build line items for PayMongo (menu items)
        const menu_line_items = orderItemsData.map(item => ({
            name: item.item_name,
            quantity: item.quantity,
            amount: Math.round(item.price_on_purchase * 100), // Convert to centavos
            currency: 'PHP'
        }));

        // 6. Add service charge as separate line item
        const service_charge_line_item = {
            name: "Service Charge (10%)",
            quantity: 1,
            amount: Math.round(serviceCharge * 100),
            currency: 'PHP'
        };

        // 7. Add VAT as separate line item
        const vat_line_item = {
            name: "VAT (12%)",
            quantity: 1,
            amount: Math.round(vatAmount * 100),
            currency: 'PHP'
        };

        // 8. Combine all line items
        const all_line_items = [
            ...menu_line_items,
            service_charge_line_item,
            vat_line_item
        ];

        // 9. Verify line items sum
        const calculatedSum = all_line_items.reduce((sum, item) => {
            return sum + (item.amount * item.quantity);
        }, 0);
        const expectedSum = Math.round(totalAmount * 100);

        if (calculatedSum !== expectedSum) {
            console.error(`Line items sum mismatch! Calculated: ${calculatedSum}, Expected: ${expectedSum}`);
            return res.status(500).json({ 
                message: "Payment calculation error. Please contact support.",
                debug: {
                    calculated: calculatedSum / 100,
                    expected: expectedSum / 100
                }
            });
        }

        // 10. Store ALL order data (Table AND Room) in Metadata
        const orderMetadata = {
            client_id: client_id.toString(),
            // Convert IDs to strings, or empty string if null (PayMongo metadata must be strings)
            table_id: table_id ? table_id.toString() : '',
            room_id: room_id ? room_id.toString() : '',
            special_instructions: special_instructions || '',
            items_total: itemsTotal.toFixed(2),
            service_charge_amount: serviceCharge.toFixed(2),
            vat_amount: vatAmount.toFixed(2),
            total_amount: totalAmount.toFixed(2),
            order_items: JSON.stringify(orderItemsData)
        };

        // Validate PayMongo configuration
        if (!process.env.PAYMONGO_SECRET_KEY || !process.env.FRONTEND_URL) {
            console.error('PAYMONGO_SECRET_KEY or FRONTEND_URL not configured');
            return res.status(500).json({ 
                message: "Payment gateway not configured. Please contact support." 
            });
        }

        console.log('Calling PayMongo API with line items:', all_line_items);

        // 11. Create PayMongo checkout session
        const paymongoResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        line_items: all_line_items,
                        payment_method_types: ['gcash', 'card', 'paymaya', 'grab_pay'],
                        success_url: `${process.env.FRONTEND_URL}/payment-success?`,
                        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
                        description: `Food & Beverages Order`,
                        remarks: `Food & Beverages Order Payment`,
                        show_line_items: true,
                        show_description: true,
                        metadata: orderMetadata
                    }
                }
            })
        });

        const paymongoData = await paymongoResponse.json();

        if (!paymongoResponse.ok) {
            console.error('PayMongo Error:', JSON.stringify(paymongoData, null, 2));
            return res.status(500).json({ 
                message: "Failed to create PayMongo payment link",
                error: paymongoData.errors?.[0]?.detail || "PayMongo API error"
            });
        }

        console.log('PayMongo link created successfully');

        res.json({
            checkout_url: paymongoData.data.attributes.checkout_url,
            payment_link_id: paymongoData.data.id,
            reference_number: paymongoData.data.attributes.reference_number
        });

    } catch (error) {
        console.error('Create Checkout Error:', error);
        res.status(500).json({ 
            message: "Failed to create checkout", 
            error: error.message 
        });
    }
};

// @desc    PayMongo Webhook Handler - CREATES order after payment
// @route   POST /api/payments/webhook
// @access  Public (verified by signature)
export const paymongoWebhook = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        console.log('Webhook received...');

        // 1. Get the raw body string (Crucial: requires express.raw in server.js)
        const bodyString = req.body.toString();

        // 2. Get the signature header
        const signatureHeader = req.headers['paymongo-signature'];
        if (!signatureHeader) {
             console.error('Missing PayMongo signature header');
             return res.status(401).json({ message: "Missing signature" });
        }

        // 3. Extract Timestamp (t) and Signature (te or li)
        const parts = signatureHeader.split(',');
        let timestamp, testSignature, liveSignature;

        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key === 't') timestamp = value;
            if (key === 'te') testSignature = value; 
            if (key === 'li') liveSignature = value; 
        });

        const signatureToMatch = liveSignature || testSignature;

        if (!timestamp || !signatureToMatch) {
            console.error('Invalid signature header format:', signatureHeader);
            return res.status(401).json({ message: "Invalid signature format" });
        }

        // 4. Construct the "Signed Payload" (Timestamp + . + Body)
        const signedPayload = `${timestamp}.${bodyString}`;
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.error('PAYMONGO_WEBHOOK_SECRET not configured');
            return res.status(500).json({ message: "Server config error" });
        }

        const computedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        // 5. Secure Comparison
        if (computedSignature !== signatureToMatch) {
            console.error('Signature mismatch!');
            return res.status(401).json({ message: "Invalid webhook signature" });
        }

        console.log('✅ Signature verified successfully!');

        // 6. Parse the body
        const event = JSON.parse(bodyString);

        if (event.data.attributes.type === 'payment.paid') {
            await connection.beginTransaction();

            const paymentData = event.data.attributes.data;
            const paymongo_payment_id = paymentData.id;
            const metadata = paymentData.attributes.metadata;

            // Check if order exists (Idempotency)
            const [existingPayment] = await connection.query(
                "SELECT * FROM fb_payments WHERE paymongo_payment_id = ?",
                [paymongo_payment_id]
            );

            if (existingPayment.length > 0) {
                await connection.commit();
                console.log('Order already processed:', paymongo_payment_id);
                return res.status(200).json({ message: "Order already processed" });
            }

            if (!metadata) {
                throw new Error("Metadata missing from payment");
            }

            // Extract Data (Handling Table OR Room)
            const client_id = metadata.client_id;
            
            // Convert empty strings back to NULL for database
            const table_id = metadata.table_id ? parseInt(metadata.table_id) : null;
            const room_id = metadata.room_id ? parseInt(metadata.room_id) : null;
            
            const special_instructions = metadata.special_instructions || null;
            const items_total = parseFloat(metadata.items_total || 0);
            const service_charge_amount = parseFloat(metadata.service_charge_amount || 0);
            const vat_amount = parseFloat(metadata.vat_amount || 0);
            const total_amount = parseFloat(metadata.total_amount || 0);
            
            // Safe JSON parse for order_items
            let order_items = [];
            try {
                if (typeof metadata.order_items === 'string') {
                    order_items = JSON.parse(metadata.order_items);
                } else if (Array.isArray(metadata.order_items)) {
                    order_items = metadata.order_items;
                }
            } catch (e) {
                console.error("Error parsing order_items:", e);
            }

            // Create Order
            // NOTE: This SQL now inserts into BOTH table_id and room_id
            const orderSql = `
                INSERT INTO fb_orders 
                (client_id, table_id, room_id, items_total, service_charge_amount, 
                 vat_amount, total_amount, special_instructions, status, order_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
            `;
            
            const [orderResult] = await connection.query(orderSql, [
                client_id,
                table_id, // If null, inserts NULL
                room_id,  // If null, inserts NULL
                items_total,
                service_charge_amount,
                vat_amount,
                total_amount,
                special_instructions
            ]);

            const new_order_id = orderResult.insertId;

            // Insert Items
            if (order_items.length > 0) {
                const orderDetailsSql = `
                    INSERT INTO fb_order_details 
                    (order_id, item_id, quantity, price_on_purchase, subtotal, instructions) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                for (const item of order_items) {
                    // ✅ CALCULATE SUBTOTAL
                    const itemSubtotal = item.quantity * item.price_on_purchase;

                    await connection.query(orderDetailsSql, [
                        new_order_id,
                        item.item_id,
                        item.quantity,
                        item.price_on_purchase,
                        itemSubtotal, // ✅ Pass the calculated value here
                        item.instructions || '' // ✅ Saves the specific note
                    ]);
                }
            }

            // Insert Payment Record
            const paymentSql = `
                INSERT INTO fb_payments 
                (order_id, payment_method, amount, payment_status, paymongo_payment_id, payment_date) 
                VALUES (?, ?, ?, 'paid', ?, NOW())
            `;
            
            await connection.query(paymentSql, [
                new_order_id,
                paymentData.attributes.source?.type || 'paymongo',
                total_amount,
                paymongo_payment_id
            ]);

            await connection.commit();
            console.log(`✅ Order #${new_order_id} created successfully. (Table: ${table_id}, Room: ${room_id})`);
            return res.status(200).json({ message: "Order created", order_id: new_order_id });

        } else if (event.data.attributes.type === 'payment.failed') {
            console.log('Payment failed event.');
            return res.status(200).json({ message: "Payment failed acknowledged" });
        }

        res.status(200).json({ message: "Event received" });

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
        await connection.beginTransaction();

        const { order_id, payment_method, amount, change_amount } = req.body;
        
        if(!order_id || !amount) {
            return res.status(400).json({ message: "Order ID and amount paid are required."});
        }

        const paymentSql = "INSERT INTO fb_payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
        const [paymentResult] = await connection.query(paymentSql, [order_id, payment_method, amount, change_amount || 0]);

        // Update order status to paid
        await connection.query("UPDATE fb_orders SET status = 'paid' WHERE order_id = ?", [order_id]);

        await connection.commit();

        res.status(201).json({ 
            payment_id: paymentResult.insertId,
            message: "Payment recorded successfully" 
        });

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
        const { order_id } = req.params;
        const [payments] = await pool.query("SELECT * FROM fb_payments WHERE order_id = ?", [order_id]);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching fb_payments", error: error.message });
    }
};