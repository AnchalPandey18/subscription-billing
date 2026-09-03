import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
    {
        subscriptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subscription",
            required: true
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

// A user should not be added twice to the same subscription
collaboratorSchema.index(
    { subscriptionId: 1, userId: 1 },
    { unique: true }
);

const Collaborator = mongoose.model(
    "Collaborator",
    collaboratorSchema
);

export default Collaborator;