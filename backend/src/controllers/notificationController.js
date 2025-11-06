import pool from "../config/mysql.js";

// @desc    Get all notifications for the logged-in customer
// @route   GET /api/notifications
// @access  Private (Customer)
export const getMyNotifications = async (req, res) => {
  try {
    const customer_id = req.user.id; // From 'protect' middleware

    // First, get the list of all notifications
    const [notifications] = await pool.query(
      `SELECT * FROM notifications 
       WHERE customer_id = ? 
       ORDER BY created_at DESC`,
      [customer_id]
    );

    // Second, get the count of *only* the unread ones
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as unreadCount 
       FROM notifications 
       WHERE customer_id = ? AND is_read = 0`,
      [customer_id]
    );

    const unreadCount = countResult[0].unreadCount || 0;

    // Send both back to the frontend
    res.json({
      notifications,
      unreadCount,
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications", error: error.message });
  }
};

// @desc    Mark all notifications as read for the logged-in customer
// @route   PUT /api/notifications/mark-read
// @access  Private (Customer)
export const markNotificationsAsRead = async (req, res) => {
  try {
    const customer_id = req.user.id; // From 'protect' middleware

    // Update all unread (is_read = 0) notifications to read (is_read = 1)
    const sql = `
      UPDATE notifications 
      SET is_read = 1 
      WHERE customer_id = ? AND is_read = 0
    `;
    
    await pool.query(sql, [customer_id]);

    res.json({ message: "Notifications marked as read" });

  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read", error: error.message });
  }
};