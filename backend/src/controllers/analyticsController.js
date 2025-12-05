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
    // 1. Get the filter from the URL query params
    const { order_type } = req.query;

    // 2. Prepare dynamic SQL condition and parameters
    let typeCondition = "";
    let queryParams = [];

    // If a specific type is requested (and it's not "All"), filter by it
    if (order_type && order_type !== 'All') {
      typeCondition = "AND order_type = ?";
      queryParams = [order_type];
    } else {
        // OPTIONAL: If you want to strictly hide 'Phone Order' even when 'All' is selected
        // uncomment the lines below:
        // typeCondition = "AND order_type != 'Phone Order'";
    }

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
          COUNT(order_id) AS fb_orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM fb_orders 
        WHERE DATE(order_date) = CURDATE() AND status != 'Cancelled' ${typeCondition}`,
        queryParams
      ),
      // Yesterday
      runQuery(
        `SELECT 
          COUNT(order_id) AS fb_orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM fb_orders 
        WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY AND status != 'Cancelled' ${typeCondition}`,
        queryParams
      ),
      // This Week (starting Monday)
      runQuery(
        `SELECT 
          COUNT(order_id) AS fb_orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM fb_orders 
        WHERE YEARWEEK(order_date, 1) = YEARWEEK(NOW(), 1) AND status != 'Cancelled' ${typeCondition}`,
        queryParams
      ),
      // This Month
      runQuery(
        `SELECT 
          COUNT(order_id) AS fb_orders, 
          SUM(total_amount) AS sales, 
          AVG(total_amount) AS avg_sale 
        FROM fb_orders 
        WHERE YEAR(order_date) = YEAR(NOW()) AND MONTH(order_date) = MONTH(NOW()) AND status != 'Cancelled' ${typeCondition}`,
        queryParams
      ),

      // --- Top Selling Items ---
      // Join with orders to apply the type filter
      runQuery(
        `SELECT 
          mi.item_name, 
          SUM(od.quantity) AS total_sold, 
          SUM(od.subtotal) AS total_sales 
        FROM fb_order_details od
        JOIN fb_menu_items mi ON od.item_id = mi.item_id
        JOIN fb_orders o ON od.order_id = o.order_id
        WHERE o.status != 'Cancelled' ${typeCondition}
        GROUP BY od.item_id, mi.item_name
        ORDER BY total_sales DESC
        LIMIT 7`,
        queryParams
      ),

      // --- Payment Methods ---
      // Note: Payments might not always map 1:1 to order_type if not joined, 
      // but usually payment analysis is global. We'll leave this global for now 
      // unless you want to filter payments by order type too (requires Join).
      runQuery(
        `SELECT 
          payment_method, 
          COUNT(payment_id) AS transactions, 
          SUM(amount) AS total_value 
        FROM fb_payments 
        WHERE payment_status = 'paid'
        GROUP BY payment_method`
      ),

      // --- Order Type Distribution ---
      // This chart usually shows the split, so filtering it might defeat the purpose,
      // but we can filter it to see the breakdown *within* the filter if needed.
      // For now, we'll keep it global to show comparison, or apply filter if you prefer?
      // Let's apply the filter so the whole dashboard reflects the selection.
      runQuery(
        `SELECT 
          order_type, 
          COUNT(order_id) AS orders, 
          SUM(total_amount) AS total_value 
        FROM fb_orders 
        WHERE status != 'Cancelled' ${typeCondition}
        GROUP BY order_type`,
        queryParams
      ),

      // --- Peak Hours ---
      runQuery(
        `SELECT 
          HOUR(order_date) AS hour, 
          COUNT(order_id) AS order_count 
        FROM fb_orders 
        WHERE status != 'Cancelled' ${typeCondition}
        GROUP BY hour 
        ORDER BY order_count DESC 
        LIMIT 1`,
        queryParams
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