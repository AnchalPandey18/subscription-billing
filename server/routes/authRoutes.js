import express from "express";
import {
    registerUser,
    loginUser
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", authMiddleware, (req, res) => {
    res.json({
        message: "You are authenticated",
        user: req.user
    });
});
router.get(
    "/admin-test",
    authMiddleware,
    authorizeRoles("Billing Admin"),
    (req, res) => {
        res.json({
            message: "Billing Admin access granted",
            user: req.user
        });
    }
);
export default router;