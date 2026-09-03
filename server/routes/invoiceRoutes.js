import express from "express";

import {
    createInvoice,
    getInvoices,
    issueInvoice,
    payInvoice,
    voidInvoice,
    bulkGenerateInvoices,
    exportInvoicesCSV,
     getOverdueInvoices
} from "../controllers/invoiceController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";

const router = express.Router();


// Create invoice
router.post(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    createInvoice
);
// get invoice
router.get(
    "/",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getInvoices
);
// Export invoices as CSV
router.get(
    "/export",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    exportInvoicesCSV
);

    // Bulk generate invoices
router.post(
    "/bulk-generate",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    bulkGenerateInvoices
);

// Get overdue invoices
router.get(
    "/overdue",
    authMiddleware,
    authorizeRoles("Billing Admin", "Account Manager"),
    getOverdueInvoices
);

// Issue invoice
router.patch(
    "/:id/issue",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    issueInvoice
);


// Pay invoice
router.patch(
    "/:id/pay",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    payInvoice
);


// Void invoice
router.patch(
    "/:id/void",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    voidInvoice
);


export default router;