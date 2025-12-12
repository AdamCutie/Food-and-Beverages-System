import pool from "../config/mysql.js";

// @desc    Get all rooms (for Room Service selection)
// @route   GET /api/rooms
// @access  Public (Used in Menu/POS)
export const getAllRooms = async (req, res) => {
    try {
        // We fetch Room ID, Number, and Status
        // Ordering by Room Number makes it easier to find
        const [rooms] = await pool.query("SELECT room_id, room_num, status, room_type FROM tbl_rooms ORDER BY room_num ASC");
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: "Error fetching rooms", error: error.message });
    }
};

export const getMyActiveRoom = async (req, res) => {
  try {
    console.log("FULL USER OBJECT:", req.user);
    const client_id = req.user.userId || req.user.id || req.user.client_id;

    // 🕵️ DEBUG LOGS: Uncover the hidden variables
    console.log("Using Client ID:", client_id);
    console.log("\n--- 🕵️ DEBUGGING ACTIVE ROOM ---");
    console.log("1. Token User ID:", client_id);
    console.log("2. Server Time:", new Date().toString()); // Checks for Timezone issues
    
    // 🔍 TEST QUERY: Check if this user has ANY reservations at all (ignoring dates/status)
    const [allRes] = await pool.query(
        "SELECT reservation_id, status, check_in, check_out FROM tbl_reservations WHERE client_id = ?", 
        [client_id]
    );
    console.log("3. All Reservations for User:", allRes);

    // Main Logic
    const sql = `
      SELECT 
        r.room_id, 
        r.room_num, 
        r.room_name,
        res.reservation_id,
        res.status,
        res.check_in,
        res.check_out
      FROM tbl_reservations res
      JOIN tbl_reservation_rooms rr ON res.reservation_id = rr.reservation_id
      JOIN tbl_rooms r ON rr.room_id = r.room_id
      WHERE res.client_id = ?
      AND res.status IN ('Approved', 'Checked In', 'Occupied') 
      AND CURDATE() >= res.check_in 
      AND CURDATE() <= res.check_out
      LIMIT 1; 
    `;

    const [rows] = await pool.query(sql, [client_id]);
    console.log("4. FINAL MATCH:", rows); 
    console.log("--------------------------------\n");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No active room reservation found." });
    }

    res.json({ success: true, room: rows[0] });

  } catch (error) {
    console.error("Get Active Room Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};