import express from "express";

import {
    createCreditNote
} from "../controllers/creditNoteController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
const router = express.Router();

// Create credit note
router.post(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    createCreditNote
);

export default router;


