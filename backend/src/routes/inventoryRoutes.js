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
// Allowed: F&B Admin and Stock Controller (Primary), Kitchen Staffs (Optional/View)
router.get(
    "/logs", 
    protect, 
    authorizeRoles("F&B Admin", "Stock Controller"), 
    getInventoryLogs
);

// --- 2. Ingredients Management ---
router.route("/")
    // View: All Staff need to see ingredients for Menu/POS to work
    .get(protect, authorizeRoles("F&B Admin", "Stock Controller"), getAllIngredients)
    // Create: Only F&B Admin and Stock Controller
    .post(protect, authorizeRoles("F&B Admin", "Stock Controller"), createIngredient);

router.route("/:id")
    .get(protect, authorizeRoles("F&B Admin", "Stock Controller"), getIngredientById)
    .put(protect, authorizeRoles("F&B Admin", "Stock Controller"), updateIngredientDetails)
    .delete(protect, authorizeRoles("F&B Admin"), deleteIngredient);

// --- 3. Stock Adjustment ---
// Allowed: F&B Admin and Stock Controller (Kitchen Staffs added if they need to report waste)
router.put(
    "/:id/stock", 
    protect, 
    authorizeRoles("F&B Admin", "Stock Controller", "Kitchen Staffs"), 
    adjustIngredientStock
);

export default router;