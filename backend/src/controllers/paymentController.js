import pool from "../config/mysql.js";

// @desc    Record a new payment
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
        const [paymentResult] = await connection.query(paymentSql, [order_id, payment_method, amount , change_amount || 0]);

        // Update order status to paid
        await connection.query("UPDATE orders SET status = 'paid' WHERE order_id = ?", [order_id]);

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