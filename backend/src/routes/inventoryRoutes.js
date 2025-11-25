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

// --- 1. Inventory Logs ---
// Allowed: F&B Admin and Kitchen Staffs (to check past movements)
router.get(
    "/logs", 
    protect, 
    authorizeRoles("F&B Admin", "Kitchen Staffs"), 
    getInventoryLogs
);

// --- 2. Ingredients Management ---
router.route("/")
    // View: All F&B Staff need to see ingredients
    .get(protect, authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), getAllIngredients)
    // Create: Only F&B Admin and Kitchen Staffs
    .post(protect, authorizeRoles("F&B Admin", "Kitchen Staffs"), createIngredient);

router.route("/:id")
    // View Single: All F&B Staff
    .get(protect, authorizeRoles("F&B Admin", "Kitchen Staffs", "Waiter", "Cashier"), getIngredientById)
    // Update Details (Name/Unit): F&B Admin and Kitchen Staffs
    .put(protect, authorizeRoles("F&B Admin", "Kitchen Staffs"), updateIngredientDetails)
    // Delete: F&B Admin Only (Critical action)
    .delete(protect, authorizeRoles("F&B Admin"), deleteIngredient);

// --- 3. Stock Adjustment ---
// Allow Kitchen Staffs to manage stock (Restock/Waste)
router.put(
    "/:id/stock", 
    protect, 
    authorizeRoles("F&B Admin", "Kitchen Staffs"), 
    adjustIngredientStock
);

export default router;