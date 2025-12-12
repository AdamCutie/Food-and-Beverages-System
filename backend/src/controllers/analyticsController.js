import pool from "../config/mysql.js";

const safeQuery = async (sql, params, fallbackValue) => {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error(`Partial Analytics Error: ${error.message}`);
    return fallbackValue;
  }
};

export const getDashboardAnalytics = async (req, res) => {
  try {
    const { order_type } = req.query;

    let typeCondition = "";
    let queryParams = [];
    let debugMessage = "No Filter Applied";

    // Normalize input (trim spaces)
    const filter = order_type ? order_type.trim() : 'All';

    if (filter !== 'All') {
        // ✅ SMART FILTER: Check for "Room Dining", "Room Service", or lowercase versions
        if (['Room Dining', 'Room Service', 'room dining', 'room service'].includes(filter)) {
            debugMessage = "✅ MATCHED: Smart Room Filter";
            // Uses 'o.' prefix for aliased queries
            typeCondition = "AND (o.order_type IN ('Room Dining', 'Room Service') OR o.delivery_location LIKE 'Room%' OR o.room_id > 0)";
        } 
        else if (filter === 'Dine-in') {
            debugMessage = "✅ MATCHED: Smart Dine-in Filter";
            typeCondition = "AND o.order_type = 'Dine-in' AND (o.delivery_location NOT LIKE 'Room%' AND (o.room_id IS NULL OR o.room_id = 0))";
        } 
        else {
            debugMessage = "⚠️ FALLBACK: Standard Exact Match";
            typeCondition = "AND o.order_type = ?";
            queryParams = [filter];
        }
    }

    const monthCondition = `AND YEAR(o.order_date) = YEAR(NOW()) AND MONTH(o.order_date) = MONTH(NOW())`;

    // Execute queries
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
      // 1. Sales Today
      safeQuery(
        `SELECT COUNT(o.order_id) AS fb_orders, SUM(o.total_amount) AS sales 
         FROM fb_orders o 
         WHERE DATE(o.order_date) = CURDATE() AND o.status != 'cancelled' ${typeCondition}`,
        queryParams, [{ fb_orders: 0, sales: 0 }]
      ),
      // 2. Sales Yesterday
      safeQuery(
        `SELECT COUNT(o.order_id) AS fb_orders, SUM(o.total_amount) AS sales
         FROM fb_orders o 
         WHERE DATE(o.order_date) = CURDATE() - INTERVAL 1 DAY AND o.status != 'cancelled' ${typeCondition}`,
        queryParams, [{ fb_orders: 0, sales: 0 }]
      ),
      // 3. This Week
      safeQuery(
        `SELECT COUNT(o.order_id) AS fb_orders, SUM(o.total_amount) AS sales
         FROM fb_orders o 
         WHERE YEARWEEK(o.order_date, 1) = YEARWEEK(NOW(), 1) AND o.status != 'cancelled' ${typeCondition}`,
        queryParams, [{ fb_orders: 0, sales: 0 }]
      ),
      // 4. This Month
      safeQuery(
        `SELECT COUNT(o.order_id) AS fb_orders, SUM(o.total_amount) AS sales
         FROM fb_orders o 
         WHERE YEAR(o.order_date) = YEAR(NOW()) AND MONTH(o.order_date) = MONTH(NOW()) AND o.status != 'cancelled' ${typeCondition}`,
        queryParams, [{ fb_orders: 0, sales: 0 }]
      ),
      // 5. Top Items
      safeQuery(
        `SELECT mi.item_name, SUM(od.quantity) AS total_sold, SUM(od.subtotal) AS total_sales 
         FROM fb_order_details od
         JOIN fb_menu_items mi ON od.item_id = mi.item_id
         JOIN fb_orders o ON od.order_id = o.order_id
         WHERE o.status != 'cancelled' ${typeCondition} ${monthCondition}
         GROUP BY od.item_id, mi.item_name
         
         -- 🚨 CHANGE THIS LINE:
         -- OLD: ORDER BY total_sales DESC LIMIT 7
         ORDER BY total_sold DESC LIMIT 7`, 
        queryParams,
        []
      ),

      // 6. Payment Methods (✅ NOW LISTENS TO THE FILTER)
      safeQuery(
        `SELECT p.payment_method, COUNT(p.payment_id) AS transactions, SUM(p.amount) AS total_value 
         FROM fb_payments p
         JOIN fb_orders o ON p.order_id = o.order_id
         -- ✅ Added \${typeCondition} here so it filters by Room/Dine-in/etc.
         WHERE p.payment_status = 'paid' AND o.status != 'cancelled' ${typeCondition} ${monthCondition}
         GROUP BY p.payment_method`,
        queryParams, // ✅ PASS queryParams here (it was [] before)
        []
      ),
      
      // 7. Order Type Distribution
      safeQuery(
        `SELECT 
           CASE 
             WHEN o.room_id IS NOT NULL AND o.room_id > 0 THEN 'Room Dining'
             WHEN o.delivery_location LIKE 'Room%' THEN 'Room Dining'
             ELSE o.order_type 
           END AS order_type, 
           COUNT(o.order_id) AS orders, 
           SUM(o.total_amount) AS total_value 
         FROM fb_orders o
         WHERE o.status != 'cancelled' ${typeCondition} ${monthCondition}
         GROUP BY 
           CASE 
             WHEN o.room_id IS NOT NULL AND o.room_id > 0 THEN 'Room Dining'
             WHEN o.delivery_location LIKE 'Room%' THEN 'Room Dining'
             ELSE o.order_type 
           END`,
        queryParams, []
      ),
      // 8. Peak Hours
      safeQuery(
        `SELECT HOUR(o.order_date) AS hour, COUNT(o.order_id) AS order_count 
         FROM fb_orders o
         WHERE o.status != 'cancelled' ${typeCondition} ${monthCondition}
         GROUP BY hour ORDER BY order_count DESC LIMIT 1`,
        queryParams, []
      ),
    ]);
    
    res.json({
      debug: {
          received_filter: filter,
          logic_used: debugMessage,
          generated_sql_condition: typeCondition
      },
      salesTrends: {
        today: salesToday[0] || {},
        yesterday: salesYesterday[0] || {},
        thisWeek: salesThisWeek[0] || {},
        thisMonth: salesThisMonth[0] || {},
      },
      topSellingItems: topSellingItems || [],
      paymentMethods: paymentMethods || [],
      orderTypeDistribution: orderTypeDistribution || [],
      peakHour: peakHours[0] ? `${peakHours[0].hour}:00 - ${peakHours[0].hour + 1}:00` : "N/A",
    });

  } catch (error) {
    console.error("Critical Analytics Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};