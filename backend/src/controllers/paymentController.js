import pool from "../config/mysql.js";
import crypto from "crypto";

// @desc    Create PayMongo payment link
// @route   POST /api/payments/:order_id/paymongo
// @access  Customer
export const createPayMongoPayment = async (req, res) => {
    try {
        const { order_id } = req.params;
        const customer_id = req.user.id;

        console.log('Creating PayMongo payment for order:', order_id);

        // 1. Get order details
        const [order] = await pool.query(
            "SELECT * FROM orders WHERE order_id = ? AND customer_id = ?", 
            [order_id, customer_id]
        );
        
        if (order.length === 0) {
            return res.status(404).json({ message: "Order not found or unauthorized" });
        }

        // Check if order is already paid or payment_status is not 'pending'
        // We check for 'pending' because that's what you set it to.
        if (order[0].status !== 'pending') {
             return res.status(400).json({ message: "Order is not in a payable state." });
        }

        // 2. --- NEW --- Get the individual line items for the order
        // We must fetch all items from `order_details` and join with `menu_items` to get names and prices.
        const [orderItems] = await pool.query(
            `SELECT od.quantity, mi.item_name, mi.price 
             FROM order_details od
             JOIN menu_items mi ON od.item_id = mi.item_id
             WHERE od.order_id = ?`,
            [order_id]
        );

        if (orderItems.length === 0) {
            return res.status(404).json({ message: "No items found for this order" });
        }

        // 3. --- NEW --- Format line_items for PayMongo
        // We must map our database rows into the array format PayMongo requires.
        const line_items = orderItems.map(item => ({
            name: item.item_name,
            quantity: item.quantity,
            amount: Math.round(parseFloat(item.price) * 100), // Price per item in cents
            currency: 'PHP' // Currency must be specified per item
        }));

        // Validate PayMongo API key
        if (!process.env.PAYMONGO_SECRET_KEY || !process.env.FRONTEND_URL) {
            console.error('PAYMONGO_SECRET_KEY or FRONTEND_URL not configured');
            return res.status(500).json({ 
                message: "Payment gateway not configured. Please contact support." 
            });
        }

        // 4. --- UPDATED PAYLOAD ---
        // We create the new body for PayMongo
        console.log('Calling PayMongo API...');
        const paymongoResponse = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`
            },
            body: JSON.stringify({
                data: {
                    attributes: {
                        // --- ❌ REMOVED ❌ ---
                        // amount: Math.round(orderTotal * 100), // PayMongo sums line_items automatically
                        
                        // --- ✅ ADDED ✅ ---
                        line_items: line_items, // The array we just built
                        
                        // --- ✅ ADDED ✅ ---
                        payment_method_types: [
                            'gcash',
                            'card',
                            'paymaya',
                            'grab_pay'
                        ],

                        // --- ✅ ADDED (Best Practice) ✅ ---
                        // These URLs are where PayMongo redirects the user after payment
                        success_url: `${process.env.FRONTEND_URL}/payment-success?order_id=${order_id}`,
                        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,

                        // --- Kept as-is ---
                        description: `Order #${order_id} Payment`,
                        remarks: `Food & Beverages - Order ${order_id}`,
                        metadata: {
                            order_id: order_id.toString(),
                            customer_id: customer_id.toString()
                        }
                    }
                }
            })
        });

        const paymongoData = await paymongoResponse.json();
        console.log('PayMongo Response Status:', paymongoResponse.status);

        if (!paymongoResponse.ok) {
            console.error('PayMongo Error:', JSON.stringify(paymongoData, null, 2));
            return res.status(500).json({ 
                message: "Failed to create PayMongo payment link",
                error: paymongoData.errors?.[0]?.detail || "PayMongo API error"
            });
        }

        console.log('PayMongo link created successfully');

        // No need to update status, it should already be 'pending' from MenuPage.jsx
        // If it wasn't, you would update it here. Your logic is fine.

        res.json({
            checkout_url: paymongoData.data.attributes.checkout_url,
            payment_link_id: paymongoData.data.id,
            reference_number: paymongoData.data.attributes.reference_number
        });

    } catch (error) {
        console.error('Create PayMongo Payment Error:', error);
        res.status(500).json({ 
            message: "Failed to create payment", 
            error: error.message 
        });
    }
};

// @desc    PayMongo Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public (verified by signature)
export const paymongoWebhook = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        console.log('Webhook received:', req.body.data?.attributes?.type);

        // Verify webhook signature
        const signature = req.headers['paymongo-signature'];
        const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
        
        if (!webhookSecret) {
            console.error('PAYMONGO_WEBHOOK_SECRET not configured');
            return res.status(500).json({ message: "Webhook not configured" });
        }

        const computedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(req.body)
            .digest('hex');

        if (signature !== computedSignature) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ message: "Invalid webhook signature" });
        }

        const event = JSON.parse(req.body.toString());

        // Handle payment.paid event
        if (event.attributes.type === 'payment.paid') {
            await connection.beginTransaction();

            const paymentData = event.attributes.data;
            const order_id = paymentData.attributes.metadata?.order_id;
            const amount = paymentData.attributes.amount / 100; // Convert from cents

            if (!order_id) {
                console.error('No order_id in webhook metadata');
                await connection.rollback();
                return res.status(400).json({ message: "Invalid webhook data" });
            }

            // Check if payment already recorded
            const [existingPayment] = await connection.query(
                "SELECT * FROM payments WHERE paymongo_payment_id = ?",
                [paymentData.id]
            );

            if (existingPayment.length > 0) {
                await connection.commit();
                console.log('Payment already processed for order:', order_id);
                return res.status(200).json({ message: "Payment already processed" });
            }

            // Record the payment
            const paymentSql = `
                INSERT INTO payments 
                (order_id, payment_method, amount, payment_status, paymongo_payment_id, payment_date) 
                VALUES (?, ?, ?, 'paid', ?, NOW())
            `;
            await connection.query(paymentSql, [
                order_id,
                paymentData.attributes.source?.type || 'paymongo',
                amount,
                paymentData.id
            ]);

            // Update order status to paid
            await connection.query(
                "UPDATE orders SET status = 'pending' WHERE order_id = ?",
                [order_id]
            );

            await connection.commit();
            console.log(`✅ Payment recorded for Order #${order_id}`);
            
            return res.status(200).json({ message: "Webhook processed successfully" });

        } else if (event.attributes.type === 'payment.failed') {
            // Handle failed payments
            const paymentData = event.attributes.data;
            const order_id = paymentData.attributes.metadata?.order_id;

            if (order_id) {
                await pool.query(
                    "UPDATE orders SET status = 'cancelled' WHERE order_id = ?",
                    [order_id]
                );
                console.log(`❌ Payment failed for Order #${order_id}`);
            }

            return res.status(200).json({ message: "Payment failure recorded" });
        }

        // For other event types, just acknowledge
        res.status(200).json({ message: "Event received" });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Webhook error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
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

        const paymentSql = "INSERT INTO payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
        const [paymentResult] = await connection.query(paymentSql, [order_id, payment_method, amount, change_amount || 0]);

        // Update order status to paid
        await connection.query("UPDATE orders SET status = 'pending' WHERE order_id = ?", [order_id]);

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
        const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [order_id]);
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching payments", error: error.message });
    }
};