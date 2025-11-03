import pool from "../config/mysql.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/* ============================================================
   🧪 1. SIMULATED PAYMENT (for testing or offline mode)
============================================================ */
export const simulatePayment = async (req, res) => {
  const { order_id } = req.params;
  const { total_amount } = req.body;

  if (!order_id || !total_amount) {
    return res.status(400).json({ message: "Order ID and total amount are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingPayments] = await connection.query(
      "SELECT * FROM payments WHERE order_id = ?",
      [order_id]
    );
    if (existingPayments.length > 0) {
      await connection.commit();
      return res.status(200).json({ message: "Payment already recorded for this order." });
    }

    const payment_method = "Simulated";
    const paymentSql =
      "INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES (?, ?, ?, 'paid')";
    const [paymentResult] = await connection.query(paymentSql, [
      order_id,
      payment_method,
      total_amount,
    ]);

    // Optional: Update order status
    await connection.query("UPDATE orders SET status = 'Paid' WHERE order_id = ?", [order_id]);

    await connection.commit();
    res.status(201).json({
      payment_id: paymentResult.insertId,
      message: "Payment simulated successfully for order " + order_id,
    });
  } catch (error) {
    await connection.rollback();
    console.error(`Error simulating payment for order ${order_id}:`, error);
    res.status(500).json({ message: "Failed to simulate payment", error: error.message });
  } finally {
    connection.release();
  }
};

/* ============================================================
   💳 2. PAYMONGO CHECKOUT (real payments)
============================================================ */
export const createPaymongoCheckout = async (req, res) => {
  const { order_id } = req.params;
  const { total_amount, payment_method } = req.body;

  if (!order_id || !total_amount) {
    return res.status(400).json({ message: "Order ID and total amount required." });
  }

  try {
    // 1️⃣ Create a Checkout Session via PayMongo API
    const response = await axios.post(
      "https://api.paymongo.com/v1/checkout_sessions",
      {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: `Payment for Order #${order_id}`,
            
            // --- 👇 ADD THIS METADATA OBJECT ---
            metadata: {
              order_id: order_id,
              customer_id: req.user.id // Good to store this too
            },
            // --- 👆 END OF ADDITION ---

            line_items: [
              {
                name: `Order #${order_id}`,
                description: `Payment for Order #${order_id}`,
                amount: Math.round(total_amount * 100), // convert PHP to centavos
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: ["card", "gcash", "grab_pay"],
            success_url: `http://localhost:5173/payment-success?order_id=${order_id}&amount=${total_amount}`,
            cancel_url: "http://localhost:5173/payment-cancel",
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.PAYMONGO_SECRET_KEY + ":"
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
      }
    );

    // 2️⃣ Record in DB (optional)
    const checkoutUrl = response.data.data.attributes.checkout_url;
    await pool.query(
      "INSERT INTO payments (order_id, payment_method, amount, payment_status) VALUES (?, ?, ?, 'pending')",
      [order_id, payment_method || "PayMongo", total_amount]
    );

    res.json({ checkoutUrl });
  } catch (error) {
    console.error("PayMongo error:", error.response?.data || error.message);
    res.status(500).json({ message: "Failed to create PayMongo checkout session" });
  }
};

/* ============================================================
   🔔 3. PAYMONGO WEBHOOK HANDLER
============================================================ */
export const handlePaymongoWebhook = async (req, res) => {
  try {
    // 1. Parse the raw body (it comes as a Buffer)
    const payload = JSON.parse(req.body.toString());

    // 2. Get the event type and payment data
    const eventType = payload?.data?.attributes?.type;
    const paymentData = payload?.data?.attributes?.data?.attributes;

    // 3. Check if the event is 'payment.paid'
    if (eventType === "payment.paid") {
      
      // 4. Get the order_id from the metadata (this is the fix)
      const order_id = paymentData?.metadata?.order_id;
      const amount = paymentData?.amount / 100; // Convert centavos back to PHP

      if (order_id) {
        // 5. Update your database
        await pool.query(
          "UPDATE payments SET payment_status = 'paid' WHERE order_id = ?",
          [order_id]
        );
        await pool.query("UPDATE orders SET status = 'Paid' WHERE order_id = ?", [
          order_id,
        ]);
        console.log(`✅ Payment confirmed for order ${order_id} (₱${amount})`);
      } else {
        console.warn("⚠️ PayMongo webhook received 'payment.paid' but no order_id in metadata.");
      }
    }

    // 6. Send a 200 OK to PayMongo
    res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

/* ============================================================
   🧾 4. CASHIER / ADMIN FUNCTIONS
============================================================ */
export const recordPayment = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { order_id, payment_method, payment_amount, change_amount } = req.body;

    if (!order_id || !payment_amount) {
      return res.status(400).json({ message: "Order ID and payment_amount are required." });
    }

    const paymentSql =
      "INSERT INTO payments (order_id, payment_method, amount, change_amount, payment_status) VALUES (?, ?, ?, ?, 'paid')";
    await connection.query(paymentSql, [
      order_id,
      payment_method,
      payment_amount,
      change_amount || 0,
    ]);
    await connection.query("UPDATE orders SET status = 'Completed' WHERE order_id = ?", [order_id]);

    await connection.commit();
    res.status(201).json({ message: "Payment recorded successfully" });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Failed to record payment", error: error.message });
  } finally {
    connection.release();
  }
};

export const getPaymentsForOrder = async (req, res) => {
  try {
    const { order_id } = req.params;
    const [payments] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [order_id]);
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching payments", error: error.message });
  }
};
