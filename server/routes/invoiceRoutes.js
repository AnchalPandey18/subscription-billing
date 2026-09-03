import express from "express";

import {
    createInvoice,
    issueInvoice,
    payInvoice,
    voidInvoice
} from "../controllers/invoiceController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// Create invoice
router.post(
    "/",
    authMiddleware,
    createInvoice
);


// Issue invoice
router.patch(
    "/:id/issue",
    authMiddleware,
    issueInvoice
);


// Pay invoice
router.patch(
    "/:id/pay",
    authMiddleware,
    payInvoice
);


// Void invoice
router.patch(
    "/:id/void",
    authMiddleware,
    voidInvoice
);


export default router;