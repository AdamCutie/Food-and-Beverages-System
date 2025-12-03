import express from "express";
import { createServer } from "http";  // ✅ ADD THIS
import { Server } from "socket.io";   // ✅ ADD THIS
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ... imports ... 
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
import tableRoutes from "../src/routes/tableRoutes.js";
import roomRoutes from "../src/routes/roomRoutes.js";
import promotionRoutes from "../src/routes/promotionRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";

// IMPORT THIS DIRECTLY FOR THE WEBHOOK FIX
import { paymongoWebhook } from "../src/controllers/paymentController.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env'); 
dotenv.config({ path: envPath });

const app = express();
const httpServer = createServer(app);  // ✅ Now works

// Socket.IO setup
const io = new Server(httpServer, {    // ✅ Now works
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:21917',
      'https://food-and-beverages-system.onrender.com'
    ],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  socket.on('join-role', (role) => {
    socket.join(role);
    console.log(`👤 User joined room: ${role}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

app.set('trust proxy', 1); 

// CORS Configuration - works for both development and production
const allowedOrigins = [
  'http://localhost:5173',   // Frontend Vite dev server
  'http://localhost:21917',  // Backend (for testing)
  'https://food-and-beverages-system.onrender.com'  // Production
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy does not allow access from this origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// --- 2. FIX: Webhook Route Placement ---
// Must define this BEFORE express.json()
// We call the controller directly to avoid path issues like /webhook/webhook
app.post(
  '/api/payments/webhook', 
  express.raw({ type: 'application/json' }), 
  paymongoWebhook
);

// Now apply JSON parsing for all other routes
app.use(express.json());

// Test DB Connection
app.get("/api/health", async (req, res) => {
    // ... existing health check code ...
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
app.use("/api/tables", tableRoutes);
app.use("/api/rooms", roomRoutes);

// Apply the general API rate limiter to all other requests
app.use("/api/", apiLimiter);

// API routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/items", itemRoutes);

// NOTE: The webhook is already handled above, this handles the other payment routes
app.use("/api/payments", paymentRoutes); 
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

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 21917;
httpServer.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));  // ✅ CHANGED

export { io };