const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const authRoutes = require("./middleware/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const publicRoutes = require("./routes/publicRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Attempt DB connection on cold start but don't exit on failure (serverless-safe)
let dbConnected = false;
const initDB = async () => {
  try {
    await connectDB();
    dbConnected = true;
  } catch (error) {
    console.error("Database connection failed:", error && error.message ? error.message : error);
  }
};

initDB();

app.use(cors());
app.use(express.json());

// Middleware: try to reconnect DB on incoming requests if not connected yet.
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log("Database reconnected on request");
    } catch (err) {
      console.error("DB reconnect failed:", err && err.message ? err.message : err);
      // proceed; endpoints should handle DB absence gracefully
    }
  }
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/user", userRoutes);

// For local development
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
