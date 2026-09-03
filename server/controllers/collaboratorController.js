import Collaborator from "../models/Collaborator.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

// Add collaborator
export const addCollaborator = async (req, res) => {
    try {
        const { subscriptionId, userId } = req.body;

        if (!subscriptionId || !userId) {
            return res.status(400).json({
                message: "Subscription ID and user ID are required"
            });
        }

        // Check subscription
        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (subscription.status === "Archived") {
            return res.status(400).json({
                message: "Cannot add collaborator to archived subscription"
            });
        }

        // Check user
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                message: "Cannot add an inactive user"
            });
        }

        // Check duplicate
        const existingCollaborator = await Collaborator.findOne({
            subscriptionId,
            userId
        });

        if (existingCollaborator) {
            return res.status(400).json({
                message: "User is already a collaborator"
            });
        }

        const collaborator = await Collaborator.create({
            subscriptionId,
            userId,
            addedBy: req.user.userId
        });

        const populatedCollaborator = await Collaborator.findById(
            collaborator._id
        )
            .populate("userId", "name email role")
            .populate("subscriptionId", "customerName planName")
            .populate("addedBy", "name email role");

        res.status(201).json({
            message: "Collaborator added successfully",
            collaborator: populatedCollaborator
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User is already a collaborator"
            });
        }

        res.status(500).json({
            message: "Failed to add collaborator",
            error: error.message
        });
    }
};


// Get collaborators for a subscription
export const getCollaborators = async (req, res) => {
    try {
        const { subscriptionId } = req.params;

        const subscription = await Subscription.findById(subscriptionId);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        const collaborators = await Collaborator.find({
            subscriptionId
        })
            .populate("userId", "name email role")
            .populate("addedBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({
            collaborators
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to get collaborators",
            error: error.message
        });
    }
};


// Remove collaborator
export const removeCollaborator = async (req, res) => {
    try {
        const { id } = req.params;

        const collaborator = await Collaborator.findById(id);

        if (!collaborator) {
            return res.status(404).json({
                message: "Collaborator not found"
            });
        }

        await Collaborator.findByIdAndDelete(id);

        res.json({
            message: "Collaborator removed successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to remove collaborator",
            error: error.message
        });
    }
};