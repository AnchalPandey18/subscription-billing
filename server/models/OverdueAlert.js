import mongoose from "mongoose";

const overdueAlertSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true
        },

        dismissedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        dismissedAt: {
            type: Date,
            default: Date.now
        },

        // Store the due date when the alert was dismissed
        dueDateAtDismissal: {
            type: Date,
            required: true
        }
    },
    { timestamps: true }
);

// One dismissal record per invoice + due date
overdueAlertSchema.index(
    { invoiceId: 1, dueDateAtDismissal: 1 },
    { unique: true }
);

const OverdueAlert = mongoose.model(
    "OverdueAlert",
    overdueAlertSchema
);

export default OverdueAlert;