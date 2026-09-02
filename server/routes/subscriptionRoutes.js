import express from "express";

import {
    createSubscription,
    getSubscriptions,
    getSubscriptionById,
    updateSubscription,
    archiveSubscription
} from "../controllers/subscriptionController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Create subscription
router.post(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    createSubscription
);

// Get all subscriptions
router.get(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getSubscriptions
);

// Get single subscription
router.get(
    "/:id",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getSubscriptionById
);

// Update subscription
router.put(
    "/:id",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    updateSubscription
);

// Archive subscription
router.patch(
    "/:id/archive",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    archiveSubscription
);

export default router;