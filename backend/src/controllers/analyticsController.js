import pool from "../config/mysql.js";

// Helper function to run a query, for cleaner Promise.all
const runQuery = async (sql, params = []) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error("SQL Error in analyticsController:", error.message);
    throw error; // Propagate error to Promise.all
  }
};

// @desc    Get all dashboard analytics data
// @route   GET /api/analytics
// @access  Admin
export const getDashboardAnalytics = async (req, res) => {
  try {
    // We will run all queries in parallel for maximum efficiency
    const [
      salesToday,
      salesYesterday,
      salesThisWeek,
      salesThisMonth,
      topSellingItems,
      paymentMethods,
      orderTypeDistribution,
      peakHours,
    ] = await Promise.all([
      // --- Sales Trends ---
      // Today
      runQuery(
        `SELECT 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM orders 
        WHERE DATE(order_date) = CURDATE() AND status != 'Cancelled'`
      ),
      // Yesterday
      runQuery(
        `SELECT 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM orders 
        WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY AND status != 'Cancelled'`
      ),
      // This Week (starting Monday)
      runQuery(
        `SELECT 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM orders 
        WHERE YEARWEEK(order_date, 1) = YEARWEEK(NOW(), 1) AND status != 'Cancelled'`
      ),
      // This Month
      runQuery(
        `SELECT 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM orders 
        WHERE YEAR(order_date) = YEAR(NOW()) AND MONTH(order_date) = MONTH(NOW()) AND status != 'Cancelled'`
      ),

      // --- Top Selling Items ---
      // We join with orders to filter out cancelled items
      runQuery(
        `SELECT 
          mi.item_name, 
          SUM(od.quantity) AS total_sold, 
          SUM(od.subtotal) AS total_sales 
        FROM order_details od
        JOIN menu_items mi ON od.item_id = mi.item_id
        JOIN orders o ON od.order_id = o.order_id
        WHERE o.status != 'Cancelled'
        GROUP BY od.item_id, mi.item_name
        ORDER BY total_sales DESC
        LIMIT 7`
      ),

      // --- Payment Methods ---
      // We only count 'paid' transactions
      runQuery(
        `SELECT 
          payment_method, 
          COUNT(payment_id) AS transactions, 
          SUM(amount) AS total_value 
        FROM payments 
        WHERE payment_status = 'paid'
        GROUP BY payment_method`
      ),

      // --- Order Type Distribution ---
      runQuery(
        `SELECT 
          order_type, 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS total_value 
        FROM orders 
        WHERE status != 'Cancelled'
        GROUP BY order_type`
      ),

      // --- Peak Hours ---
      runQuery(
        `SELECT 
          HOUR(order_date) AS hour, 
          COUNT(order_id) AS order_count 
        FROM orders 
        WHERE status != 'Cancelled'
        GROUP BY hour 
        ORDER BY order_count DESC 
        LIMIT 1`
      ),
    ]);

    // Format the data into a clean JSON object
    res.json({
      salesTrends: {
        today: salesToday[0],
        yesterday: salesYesterday[0],
        thisWeek: salesThisWeek[0],
        thisMonth: salesThisMonth[0],
      },
      topSellingItems: topSellingItems,
      paymentMethods: paymentMethods,
      orderTypeDistribution: orderTypeDistribution,
      peakHour: peakHours[0] ? `${peakHours[0].hour}:00 - ${peakHours[0].hour + 1}:00` : "N/A",
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ message: "Server error fetching analytics", error: error.message });
  }
};