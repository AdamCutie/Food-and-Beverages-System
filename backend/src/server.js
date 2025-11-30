import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env'); 
dotenv.config({ path: envPath });

import pool from "../src/config/mysql.js";

// Middleware
import { notFound, errorHandler } from "../src/middleware/errorMiddleware.js";
import { apiLimiter, authLimiter } from "../src/middleware/rateLimiter.js";

// Routes
import authRoutes from "../src/routes/authRoutes.js";
import itemRoutes from "../src/routes/itemRoutes.js";
import orderRoutes from "../src/routes/orderRoutes.js";
import paymentRoutes from "../src/routes/paymentRoutes.js";
import adminRoutes from "../src/routes/adminRoutes.js";
import uploadRoutes from './routes/uploadRoutes.js';
import inventoryRoutes from "../src/routes/inventoryRoutes.js";
import categoryRoutes from "../src/routes/categoryRoutes.js";
import analyticsRoutes from "../src/routes/analyticsRoutes.js";
import dashboardRoutes from "../src/routes/dashboardRoutes.js";
import notificationRoutes from "../src/routes/notificationRoutes.js";

// --- NEW ROUTES (Added for Normalization & Promos) ---
import tableRoutes from "../src/routes/tableRoutes.js";
import roomRoutes from "../src/routes/roomRoutes.js";
import promotionRoutes from "../src/routes/promotionRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";

const app = express();

if (process.env.NODE_ENV !== "production") {
  app.use(cors({
    origin:"http://localhost:21917",
  }));
}

// CRITICAL: Webhook route with raw body parser MUST come BEFORE express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentRoutes);

// Now apply JSON parsing for all other routes
app.use(express.json());

// Test DB Connection
app.get("/api/health", async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send({ status: "OK", database: "Connected", time: new Date() });
  } catch (e) {
    res.status(500).send({ status: "Error", database: "Not Connected", error: e.message });
  }
});

// Routes exempt from strict Rate Limiter
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes); 
app.use("/api/tables", tableRoutes); // Tables (Public for Menu)
app.use("/api/rooms", roomRoutes);   // Rooms (Public for Menu)

// Apply the general API rate limiter to all other requests
app.use("/api/", apiLimiter);

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/payments", paymentRoutes); // Note: This handles non-webhook payment routes
app.use("/api/admin", adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use("/api/analytics", analyticsRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/upload', uploadRoutes); 

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if(process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname,"../../frontend/dist")))

  app.get("*",(req,res)=>{
    res.sendFile(path.join(__dirname,"../../frontend","dist","index.html"))
  })
}

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));