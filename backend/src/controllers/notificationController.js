import pool from "../config/mysql.js";

// @desc    Get all notifications for the logged-in customer
// @route   GET /api/notifications
// @access  Private (Customer)
export const getMyNotifications = async (req, res) => {
  try {
    const client_id = req.user.id; // From 'protect' middleware

    // First, get the list of all notifications
    const [notifications] = await pool.query(
      `SELECT * FROM fb_notifications 
       WHERE client_id = ? 
       ORDER BY created_at DESC`,
      [client_id]
    );

    // Second, get the count of *only* the unread ones
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as unreadCount 
       FROM fb_notifications 
       WHERE client_id = ? AND is_read = 0`,
      [client_id]
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
    const client_id = req.user.id; // From 'protect' middleware

    // Update all unread (is_read = 0) notifications to read (is_read = 1)
    const sql = `
      UPDATE fb_notifications 
      SET is_read = 1 
      WHERE client_id = ? AND is_read = 0
    `;
    
    await pool.query(sql, [client_id]);

    res.json({ message: "Notifications marked as read" });

  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read", error: error.message });
  }
};

// --- NEW FUNCTION 1 ---
// @desc    Delete a single notification by its ID
// @route   DELETE /api/notifications/:id
// @access  Private (Customer)
export const deleteNotificationById = async (req, res) => {
  try {
    const client_id = req.user.id; // From 'protect' middleware
    const { id: notification_id } = req.params; // Get ID from URL

    const sql = "DELETE FROM fb_notifications WHERE notification_id = ? AND client_id = ?";
    const [result] = await pool.query(sql, [notification_id, client_id]);

    if (result.affectedRows === 0) {
      // This means the notification either didn't exist or didn't belong to this user
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification", error: error.message });
  }
};

// --- NEW FUNCTION 2 ---
// @desc    Delete ALL notifications for the logged-in customer
// @route   DELETE /api/notifications/clear-all
// @access  Private (Customer)
export const clearAllNotifications = async (req, res) => {
  try {
    const client_id = req.user.id; // From 'protect' middleware

    const sql = "DELETE FROM fb_notifications WHERE client_id = ?";
    await pool.query(sql, [client_id]);

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ message: "Failed to clear notifications", error: error.message });
  }
};