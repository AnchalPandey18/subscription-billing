import Invoice from "../models/Invoice.js";
import Subscription from "../models/Subscription.js";

// Create Invoice
export const createInvoice = async (req, res) => {
    try {
        const {
            subscriptionId,
            invoiceNumber,
            dueDate
        } = req.body;

        // Check required fields
        if (!subscriptionId || !invoiceNumber || !dueDate) {
            return res.status(400).json({
                message: "Subscription ID, invoice number and due date are required"
            });
        }

        // Find subscription
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        // Don't create invoice for archived subscription
        if (subscription.status === "Archived") {
            return res.status(400).json({
                message: "Cannot create invoice for archived subscription"
            });
        }

        // Create invoice
        const invoice = await Invoice.create({
            invoiceNumber,
            subscriptionId: subscription._id,
            customerName: subscription.customerName,
            customerEmail: subscription.customerEmail,
            amount: subscription.amount,
            currency: subscription.currency,
            dueDate,
            createdBy: req.user.userId
        });

        res.status(201).json({
            message: "Invoice created successfully",
            invoice
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create invoice",
            error: error.message
        });
    }
};


// Issue Invoice
export const issueInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        // Only Draft invoices can be issued
        if (invoice.status !== "Draft") {
            return res.status(400).json({
                message: `Cannot issue invoice with status ${invoice.status}`
            });
        }

        invoice.status = "Issued";

        await invoice.save();

        res.json({
            message: "Invoice issued successfully",
            invoice
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to issue invoice",
            error: error.message
        });
    }
};


// Pay Invoice
export const payInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        // Only Issued invoices can be paid
        if (invoice.status !== "Issued") {
            return res.status(400).json({
                message: `Cannot pay invoice with status ${invoice.status}`
            });
        }

        invoice.status = "Paid";
        invoice.paidAt = new Date();

        await invoice.save();

        res.json({
            message: "Invoice paid successfully",
            invoice
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to pay invoice",
            error: error.message
        });
    }
};


// Void Invoice
export const voidInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        // Paid invoices cannot be voided
        if (invoice.status === "Paid") {
            return res.status(400).json({
                message: "Paid invoice cannot be voided"
            });
        }

        // Already void invoice
        if (invoice.status === "Void") {
            return res.status(400).json({
                message: "Invoice is already void"
            });
        }

        invoice.status = "Void";
        invoice.voidedAt = new Date();

        await invoice.save();

        res.json({
            message: "Invoice voided successfully",
            invoice
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to void invoice",
            error: error.message
        });
    }
};