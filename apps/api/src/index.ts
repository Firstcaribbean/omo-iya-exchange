import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { apiLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";

// Import Routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import paymentRoutes from "./routes/payment.routes";
import adminRoutes from "./routes/admin.routes";
import supportRoutes from "./routes/support.routes";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// We need the raw body parsing limit configuration for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Standard rate limiter for all API endpoints
app.use("/api/", apiLimiter);

// Bind Route Handlers
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);


// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Omo Iya Exchange API is healthy and connected",
    timestamp: new Date(),
  });
});

// Serve local static file uploads during development
app.use("/uploads", express.static("uploads"));

// Global central error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`[Omo Iya Exchange API] Server Initialized`);
  console.log(`[Status] Running on port: ${PORT}`);
  console.log(`[Environment] Node: ${process.version}`);
  console.log(`=========================================`);
});
