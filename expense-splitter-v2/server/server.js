require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const participantRoutes = require("./routes/participantRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/events/:eventId/participants", participantRoutes);
app.use("/api/events/:eventId/expenses", expenseRoutes);
app.use("/api/events/:eventId/summary", summaryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events/:eventId/settlements", settlementRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
