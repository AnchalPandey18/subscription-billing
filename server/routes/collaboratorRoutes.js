import express from "express";

import {
    addCollaborator,
    getCollaborators,
    removeCollaborator
} from "../controllers/collaboratorController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

// Add collaborator
router.post(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    addCollaborator
);

// Get collaborators for a subscription
router.get(
    "/:subscriptionId",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getCollaborators
);

// Remove collaborator
router.delete(
    "/:id",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    removeCollaborator
);

export default router;