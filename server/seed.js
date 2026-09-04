import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";

dotenv.config();

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);

        console.log("MongoDB connected");

        const adminPassword = await bcrypt.hash("Admin@123", 10);
        const managerPassword = await bcrypt.hash("Test@12345", 10);

        await User.findOneAndUpdate(
            { email: "billingadmin@test.com" },
            {
                name: "Billing Admin",
                email: "billingadmin@test.com",
                password: adminPassword,
                role: "Billing Admin",
                isActive: true
            },
            { upsert: true, new: true }
        );

        await User.findOneAndUpdate(
            { email: "manager@test.com" },
            {
                name: "Account Manager",
                email: "manager@test.com",
                password: managerPassword,
                role: "Account Manager",
                isActive: true
            },
            { upsert: true, new: true }
        );

        console.log("Seed users created successfully");
        console.log("");
        console.log("Billing Admin:");
        console.log("Email: billingadmin@test.com");
        console.log("Password: Admin@123");
        console.log("");
        console.log("Account Manager:");
        console.log("Email: manager@test.com");
        console.log("Password: Test@12345");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error.message);
        process.exit(1);
    }
};

seedUsers();