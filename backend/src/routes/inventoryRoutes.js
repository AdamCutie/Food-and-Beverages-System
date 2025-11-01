import express from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import {
    createIngredient,
    getAllIngredients,
    getIngredientById,
    updateIngredientDetails,
    adjustIngredientStock,
    deleteIngredient,
    getInventoryLogs
} from "../controllers/inventoryController.js";

const router = express.Router();

// --- ⭐️ FIX: "/logs" MUST be defined before "/:id" ---
// @access Admin only
router.get("/logs", protect, authorizeRoles("admin"), getInventoryLogs);

// @access Staff (Admin, Waiter, Cashier)
router.route("/")
    .get(protect, authorizeRoles("admin", "waiter", "cashier"), getAllIngredients)
    .post(protect, authorizeRoles("admin", "waiter", "cashier"), createIngredient);

// @access Staff (Admin, Waiter, Cashier)
// This will now correctly handle IDs (e.g., /1, /2) and not "logs"
router.route("/:id")
    .get(protect, authorizeRoles("admin", "waiter", "cashier"), getIngredientById)
    .put(protect, authorizeRoles("admin", "waiter", "cashier"), updateIngredientDetails)
    .delete(protect, authorizeRoles("admin", "waiter", "cashier"), deleteIngredient);

// @access Staff (Admin, Waiter, Cashier)
router.put("/:id/stock", protect, authorizeRoles("admin", "waiter", "cashier"), adjustIngredientStock);

export default router;