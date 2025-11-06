import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pool from "../src/config/mysql.js";
import path from "path";

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

dotenv.config();

const app = express();
app.use(cors());
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

// Para di tamaan ng Rate limiter middleware
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes); 

// Apply the general API rate limiter to all requests starting with /api
app.use("/api/", apiLimiter);

// API routes
// Apply the stricter auth limiter specifically to auth routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/items", itemRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use("/api/analytics", analyticsRoutes); 
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes); // Upload Image route
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));