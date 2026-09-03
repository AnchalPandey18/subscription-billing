import express from "express";

import {
    getOverdueAlerts,
    dismissOverdueAlert
} from "../controllers/overdueAlertController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Get overdue alerts
router.get(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getOverdueAlerts
);

// Dismiss overdue alert
router.patch(
    "/:invoiceId/dismiss",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    dismissOverdueAlert
);

export default router;