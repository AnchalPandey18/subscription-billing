import mongoose from "mongoose";

const creditNoteSchema = new mongoose.Schema(
    {
        creditNoteNumber: {
            type: String,
            required: true,
            unique: true
        },

        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true
        },

        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true
        },

        reason: {
            type: String,
            required: true
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

const CreditNote = mongoose.model("CreditNote", creditNoteSchema);

export default CreditNote;