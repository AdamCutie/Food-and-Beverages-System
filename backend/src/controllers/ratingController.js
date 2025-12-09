import pool from "../config/mysql.js";

// @desc    Add a review for a food item
// @route   POST /api/ratings
// @access  Customer
export const addRating = async (req, res) => {
    const { item_id, rating_value, review_text } = req.body;
    const client_id = req.user.id; // From JWT

    if (!item_id || !rating_value) {
        return res.status(400).json({ message: "Item and rating are required" });
    }

    try {
        // 1. VERIFY PURCHASE: Check if user has a 'served' order with this item
        // We join orders and order_details to find a match
        const [purchaseCheck] = await pool.query(`
            SELECT o.order_id 
            FROM fb_orders o
            JOIN fb_order_details od ON o.order_id = od.order_id
            WHERE o.client_id = ? 
              AND od.item_id = ? 
              AND o.status = 'served'
            LIMIT 1
        `, [client_id, item_id]);

        if (purchaseCheck.length === 0) {
            return res.status(403).json({ message: "You can only rate items you have purchased and received." });
        }

        // 2. CHECK DUPLICATE: Optional - Prevent rating the same item twice?
        // For now, we allow it (maybe they ordered it again). 
        // If you want 1 rating per user per item, uncomment this:
        /*
        const [existing] = await pool.query(
            "SELECT rating_id FROM fb_food_ratings WHERE client_id = ? AND item_id = ?",
            [client_id, item_id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "You have already rated this item." });
        }
        */

        // 3. INSERT RATING
        await pool.query(`
            INSERT INTO fb_food_ratings (client_id, item_id, rating_value, review_text)
            VALUES (?, ?, ?, ?)
        `, [client_id, item_id, rating_value, review_text]);

        res.status(201).json({ message: "Review submitted successfully" });

    } catch (error) {
        console.error("Add Rating Error:", error);
        res.status(500).json({ message: "Server error submitting review" });
    }
};

// @desc    Get reviews for a specific item
// @route   GET /api/ratings/:itemId
// @access  Public
export const getItemReviews = async (req, res) => {
    try {
        const { itemId } = req.params;

        const [reviews] = await pool.query(`
            SELECT 
                r.rating_id, 
                r.rating_value, 
                r.review_text, 
                r.created_at,
                c.first_name, 
                c.last_name
            FROM fb_food_ratings r
            JOIN tbl_client_users c ON r.client_id = c.client_id
            WHERE r.item_id = ?
            ORDER BY r.created_at DESC
        `, [itemId]);

        // Calculate Average
        const [stats] = await pool.query(`
            SELECT AVG(rating_value) as average, COUNT(*) as count
            FROM fb_food_ratings
            WHERE item_id = ?
        `, [itemId]);

        res.json({
            reviews,
            average: parseFloat(stats[0].average || 0).toFixed(1),
            total_reviews: stats[0].count
        });

    } catch (error) {
        console.error("Get Reviews Error:", error);
        res.status(500).json({ message: "Server error fetching reviews" });
    }
};