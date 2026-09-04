import authRoutes from "./routes/authRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import creditNoteRoutes from "./routes/creditNoteRoutes.js";
import collaboratorRoutes from "./routes/collaboratorRoutes.js";
import overdueAlertRoutes from "./routes/overdueAlertRoutes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/credit-notes", creditNoteRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/overdue-alerts", overdueAlertRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Subscription Billing API is running"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});






