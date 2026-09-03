import express from "express";

import {
    createCreditNote
} from "../controllers/creditNoteController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create credit note
router.post(
    "/",
    authMiddleware,
    createCreditNote
);

export default router;