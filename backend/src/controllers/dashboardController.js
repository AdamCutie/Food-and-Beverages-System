import pool from "../config/mysql.js";

// Helper to calculate growth percentage
const calculateGrowth = (today, yesterday) => {
  if (yesterday > 0) {
    return parseFloat(((today - yesterday) / yesterday * 100).toFixed(2));
  }
  return today > 0 ? 100 : 0;
};

// --- GET Dashboard Summary ---
export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Sales Today (Net Sales: Excluding Cancelled)
    const [salesTodayRows] = await pool.query(`
      SELECT SUM(total_amount) AS total
      FROM fb_orders
      WHERE DATE(order_date) = CURDATE() 
      AND status != 'cancelled'
    `);

    const [salesYesterdayRows] = await pool.query(`
      SELECT SUM(total_amount) AS total
      FROM fb_orders
      WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY 
      AND status != 'cancelled'
    `);

    const totalSales = Number(salesTodayRows[0].total || 0);
    const salesYesterday = Number(salesYesterdayRows[0].total || 0);
    const salesGrowth = calculateGrowth(totalSales, salesYesterday);

    // 2. Active Orders (Current Kitchen Load)
    const [activeOrdersRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM fb_orders
      WHERE status IN ('pending', 'preparing', 'ready')
    `);

    // 3. Orders Growth (Volume Comparison: Today vs Yesterday)
    const [volumeTodayRows] = await pool.query(`
      SELECT COUNT(*) AS total FROM fb_orders 
      WHERE DATE(order_date) = CURDATE() AND status != 'cancelled'
    `);
    const [volumeYesterdayRows] = await pool.query(`
      SELECT COUNT(*) AS total FROM fb_orders 
      WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY AND status != 'cancelled'
    `);

    const activeOrders = activeOrdersRows[0].total || 0;
    const ordersGrowth = calculateGrowth(volumeTodayRows[0].total, volumeYesterdayRows[0].total);

    // 4. Low Stock Items
    const [lowStockRows] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM fb_ingredients
      WHERE stock_level <= COALESCE(reorder_point, 10)
    `);

    const lowStock = lowStockRows[0].total || 0;
    const lowStockGrowth = 0; 

    // 5. Available Tables
    const [tableRows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as available
      FROM fb_tables
    `);

    const availableTables = Number(tableRows[0].available || 0);
    const totalTables = Number(tableRows[0].total || 0);

    // 6. Recent Orders
    const [recentOrders] = await pool.query(`
      SELECT order_id, client_id, order_date, status, total_amount, order_type, delivery_location
      FROM fb_orders
      ORDER BY order_date DESC
      LIMIT 5
    `);

    // 7. Stock Alerts List
    // ✅ FIX: Removed JOIN with fb_suppliers. Hardcoded supplier_name.
    const [stockAlerts] = await pool.query(`
      SELECT 
        ingredient_id, 
        name, 
        stock_level AS stock
      FROM fb_ingredients
      WHERE stock_level <= COALESCE(reorder_point, 10)
      ORDER BY stock_level ASC
      LIMIT 5
    `);

    // --- Respond with updated data ---
    res.json({
      summary: {
        totalSales,
        salesGrowth,
        activeOrders,
        ordersGrowth,
        lowStock,
        lowStockGrowth,
        availableTables,
        totalTables
      },
      recentOrders,
      stockAlerts,
    });

  } catch (err) {
    console.error("Error fetching dashboard summary:", err);
    res.status(500).json({ message: "Server error fetching dashboard summary", error: err.message });
  }
};