import express from "express"
import {changePassword, deleteUserAccount, forgotPassword, getUserProfile, getUserStats, Login, Register, resendVerificationEmail, resetPassword, updateUserProfile, verifyEmail} from "../controllers/user.controller.js";
import { protect, requireVerified } from "../middlewares/auth.middleware.js";

const auth = express.Router();

auth.post("/users/register", Register);
auth.post("/users/login", Login);

// Email Verification
auth.get("/verify-email/:token", verifyEmail);
auth.post("/resend-verification", resendVerificationEmail);

// Password Reset
auth.post("/forgot-password", forgotPassword);
auth.post("/reset-password/:token", resetPassword);

// ===============================
//  PROTECTED ROUTES (Auth Required)
// ===============================

// Profile Management
auth.get("/profile", protect, requireVerified, getUserProfile);
auth.put("/profile", protect, updateUserProfile);
auth.delete("/profile", protect, deleteUserAccount);


// Password Management
auth.put("/change-password", protect, changePassword);

// User Statistics
auth.get("/stats", protect, getUserStats);

export default auth;        