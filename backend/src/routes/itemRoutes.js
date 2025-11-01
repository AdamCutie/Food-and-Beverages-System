import express from "express";
import {
    getAllItems,
    getItemById,
    // createMenuItem,  <-- REMOVED
    // updateMenuItem,  <-- REMOVED
    // deleteMenuItem   <-- REMOVED
} from "../controllers/itemController.js";

const router = express.Router();

// Public Routes
router.get("/", getAllItems);
router.get("/:id", getItemById); 

// Admin-Only Routes (REMOVED from this file)
// router.post("/", createMenuItem);
// router.put("/:id", updateMenuItem);
// router.delete("/:id", deleteMenuItem);

export default router;