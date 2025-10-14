import express from "express";
import {
    getAllItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem
} from "../controllers/itemController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getAllItems);
router.post("/", protect, authorizeRoles('admin'), createMenuItem);
router.put("/:id", protect, authorizeRoles('admin'), updateMenuItem);
router.delete("/:id", protect, authorizeRoles('admin'), deleteMenuItem);

export default router;