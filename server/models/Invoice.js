import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true
    },

    customerName: {
      type: String,
      required: true
    },

    customerEmail: {
      type: String,
      required: true
    },

    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: true
    },

    currency: {
      type: String,
      required: true,
      default: "INR"
    },

    issueDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    dueDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["Draft", "Issued", "Paid", "Void"],
      default: "Draft"
    },

    paidAt: {
      type: Date,
      default: null
    },

    voidedAt: {
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

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;