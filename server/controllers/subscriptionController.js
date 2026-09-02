import Subscription from "../models/Subscription.js";

// Create Subscription
export const createSubscription = async (req, res) => {
    try {
        const {
            customerName,
            customerEmail,
            planName,
            amount,
            currency,
            billingCycle,
            startDate,
            nextBillingDate
        } = req.body;

        if (
            !customerName ||
            !customerEmail ||
            !planName ||
            amount === undefined ||
            !billingCycle ||
            !startDate ||
            !nextBillingDate
        ) {
            return res.status(400).json({
                message: "All required fields must be provided"
            });
        }

        const subscription = await Subscription.create({
            customerName,
            customerEmail,
            planName,
            amount,
            currency,
            billingCycle,
            startDate,
            nextBillingDate,
            createdBy: req.user.userId
        });

        res.status(201).json({
            message: "Subscription created successfully",
            subscription
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to create subscription",
            error: error.message
        });
    }
};


// Get All Subscriptions
export const getSubscriptions = async (req, res) => {
    try {
        const subscriptions = await Subscription.find()
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 });

        res.json({
            count: subscriptions.length,
            subscriptions
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch subscriptions",
            error: error.message
        });
    }
};


// Get Single Subscription
export const getSubscriptionById = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id)
            .populate("createdBy", "name email role");

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        res.json({
            subscription
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch subscription",
            error: error.message
        });
    }
};


// Update Subscription
export const updateSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        // Archived subscriptions should not be edited
        if (subscription.status === "Archived") {
            return res.status(400).json({
                message: "Archived subscription cannot be updated"
            });
        }

        const {
            customerName,
            customerEmail,
            planName,
            amount,
            currency,
            billingCycle,
            startDate,
            nextBillingDate
        } = req.body;

        subscription.customerName =
            customerName ?? subscription.customerName;

        subscription.customerEmail =
            customerEmail ?? subscription.customerEmail;

        subscription.planName =
            planName ?? subscription.planName;

        subscription.amount =
            amount ?? subscription.amount;

        subscription.currency =
            currency ?? subscription.currency;

        subscription.billingCycle =
            billingCycle ?? subscription.billingCycle;

        subscription.startDate =
            startDate ?? subscription.startDate;

        subscription.nextBillingDate =
            nextBillingDate ?? subscription.nextBillingDate;

        await subscription.save();

        res.json({
            message: "Subscription updated successfully",
            subscription
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update subscription",
            error: error.message
        });
    }
};


// Archive Subscription
export const archiveSubscription = async (req, res) => {
    try {
        const subscription = await Subscription.findById(req.params.id);

        if (!subscription) {
            return res.status(404).json({
                message: "Subscription not found"
            });
        }

        if (subscription.status === "Archived") {
            return res.status(400).json({
                message: "Subscription is already archived"
            });
        }

        subscription.status = "Archived";
        subscription.archivedAt = new Date();

        await subscription.save();

        res.json({
            message: "Subscription archived successfully",
            subscription
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to archive subscription",
            error: error.message
        });
    }
};