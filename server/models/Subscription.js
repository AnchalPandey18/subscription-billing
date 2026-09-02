import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true,
            trim: true
        },

        customerEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        planName: {
            type: String,
            required: true,
            trim: true
        },

        amount: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            required: true,
            default: "INR",
            uppercase: true
        },

        billingCycle: {
            type: String,
            enum: ["Monthly", "Yearly"],
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        nextBillingDate: {
            type: Date,
            required: true
        },

        status: {
            type: String,
            enum: ["Active", "Archived"],
            default: "Active"
        },

        archivedAt: {
            type: Date,
            default: null
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

const Subscription = mongoose.model(
    "Subscription",
    subscriptionSchema
);

export default Subscription;