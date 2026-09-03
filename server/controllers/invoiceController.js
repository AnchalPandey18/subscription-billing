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

// Get Invoices with Search, Filter and Pagination
export const getInvoices = async (req, res) => {
    try {
        const {
            search = "",
            status,
            fromDate,
            toDate,
            page = 1,
            limit = 10
        } = req.query;

        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.min(Math.max(Number(limit), 1), 100);

        const query = {};

        // Search
        if (search.trim()) {
            query.$or = [
                {
                    invoiceNumber: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    customerName: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                },
                {
                    customerEmail: {
                        $regex: search.trim(),
                        $options: "i"
                    }
                }
            ];
        }

        // Status filter
        if (status) {
            const allowedStatuses = [
                "Draft",
                "Issued",
                "Paid",
                "Void"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid invoice status"
                });
            }

            query.status = status;
        }

        // Date filter
        if (fromDate || toDate) {
            query.issueDate = {};

            if (fromDate) {
                const startDate = new Date(fromDate);

                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid fromDate"
                    });
                }

                query.issueDate.$gte = startDate;
            }

            if (toDate) {
                const endDate = new Date(toDate);

                if (isNaN(endDate.getTime())) {
                    return res.status(400).json({
                        message: "Invalid toDate"
                    });
                }

                endDate.setHours(23, 59, 59, 999);

                query.issueDate.$lte = endDate;
            }
        }

        const skip = (currentPage - 1) * perPage;

        const invoices = await Invoice.find(query)
            .populate("subscriptionId")
            .populate("createdBy", "name email role")
            .sort({ issueDate: -1 })
            .skip(skip)
            .limit(perPage);

        const totalInvoices = await Invoice.countDocuments(query);

        const totalPages = Math.ceil(totalInvoices / perPage);

        res.json({
            invoices,
            pagination: {
                currentPage,
                perPage,
                totalInvoices,
                totalPages
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch invoices",
            error: error.message
        });
    }
};

// Bulk Generate Invoices
export const bulkGenerateInvoices = async (req, res) => {
    try {
        const now = new Date();

        // Find active subscriptions whose billing date has arrived
        const subscriptions = await Subscription.find({
            status: "Active",
            nextBillingDate: { $lte: now }
        });

        const createdInvoices = [];
        const skippedSubscriptions = [];
        const errors = [];

        for (const subscription of subscriptions) {
            try {
                const billingDate = new Date(subscription.nextBillingDate);

                // Check if invoice already exists for this billing date
                const existingInvoice = await Invoice.findOne({
                    subscriptionId: subscription._id,
                    dueDate: billingDate
                });

                if (existingInvoice) {
                    skippedSubscriptions.push({
                        subscriptionId: subscription._id,
                        reason: "Invoice already exists for this billing period"
                    });

                    continue;
                }

                // Generate a unique invoice number
                const invoiceNumber =
                    `INV-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

                const invoice = await Invoice.create({
                    invoiceNumber,
                    subscriptionId: subscription._id,
                    customerName: subscription.customerName,
                    customerEmail: subscription.customerEmail,
                    amount: subscription.amount,
                    currency: subscription.currency,
                    dueDate: billingDate,
                    createdBy: req.user.userId
                });

                createdInvoices.push(invoice);

                // Move subscription to next billing date
                const nextBillingDate = new Date(billingDate);

                if (subscription.billingCycle === "Monthly") {
                    nextBillingDate.setMonth(
                        nextBillingDate.getMonth() + 1
                    );
                } else if (subscription.billingCycle === "Yearly") {
                    nextBillingDate.setFullYear(
                        nextBillingDate.getFullYear() + 1
                    );
                }

                subscription.nextBillingDate = nextBillingDate;

                await subscription.save();

            } catch (error) {
                errors.push({
                    subscriptionId: subscription._id,
                    message: error.message
                });
            }
        }

        res.status(200).json({
            message: "Bulk invoice generation completed",
            summary: {
                totalSubscriptions: subscriptions.length,
                invoicesCreated: createdInvoices.length,
                subscriptionsSkipped: skippedSubscriptions.length,
                errors: errors.length
            },
            createdInvoices,
            skippedSubscriptions,
            errors
        });

    } catch (error) {
        res.status(500).json({
            message: "Bulk invoice generation failed",
            error: error.message
        });
    }
};