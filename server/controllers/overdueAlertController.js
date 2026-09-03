import OverdueAlert from "../models/OverdueAlert.js";
import Invoice from "../models/Invoice.js";

// Get overdue alerts
export const getOverdueAlerts = async (req, res) => {
    try {
        const today = new Date();

        const overdueInvoices = await Invoice.find({
            status: "Issued",
            dueDate: { $lt: today }
        })
            .populate("createdBy", "name email role")
            .sort({ dueDate: 1 });

        const alerts = [];

        for (const invoice of overdueInvoices) {
            const dismissedAlert = await OverdueAlert.findOne({
                invoiceId: invoice._id,
                dueDateAtDismissal: invoice.dueDate
            });

            if (!dismissedAlert) {
                alerts.push(invoice);
            }
        }

        res.json({
            overdueAlerts: alerts,
            count: alerts.length
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch overdue alerts",
            error: error.message
        });
    }
};


// Dismiss overdue alert
export const dismissOverdueAlert = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.invoiceId);

        if (!invoice) {
            return res.status(404).json({
                message: "Invoice not found"
            });
        }

        if (invoice.status !== "Issued" || invoice.dueDate >= new Date()) {
            return res.status(400).json({
                message: "Invoice is not currently overdue"
            });
        }

        const existingAlert = await OverdueAlert.findOne({
            invoiceId: invoice._id,
            dueDateAtDismissal: invoice.dueDate
        });

        if (existingAlert) {
            return res.status(400).json({
                message: "Overdue alert is already dismissed"
            });
        }

        const alert = await OverdueAlert.create({
            invoiceId: invoice._id,
            dismissedBy: req.user.userId,
            dueDateAtDismissal: invoice.dueDate
        });

        res.status(201).json({
            message: "Overdue alert dismissed successfully",
            alert
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to dismiss overdue alert",
            error: error.message
        });
    }
};