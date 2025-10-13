import generateToken from "../helper/generateToken.js";
import User from "../schema/User.schema.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService.js";

// ===============================
//  REGISTRATION & AUTHENTICATION
// ===============================

export const Register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
    
    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const alreadyUser = await User.findOne({ email });
    if (alreadyUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      verificationToken,
      isVerified: false,
    });

    await newUser.save();

    // Send verification email
    await sendVerificationEmail(email, firstName, verificationToken);

    const token = generateToken(newUser);
    return res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      user: {
        id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        isVerified: newUser.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in",
        requiresVerification: true 
      });
    }

    user.stats.lastLogin = new Date();
    user.stats.loginStreak += 1;
    await user.save();

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        settings: user.settings,
        isVerified: user.isVerified,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ===============================
//  EMAIL VERIFICATION
// ===============================

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email Verification Error:", error);
    res.status(500).json({ message: "Server error during email verification" });
  }
};


export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    // Send verification email
    await sendVerificationEmail(email, user.firstName, verificationToken);

    res.json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ message: "Server error while resending verification email" });
  }
};

// ===============================
//  PROFILE 
// ===============================
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, currency, language, timezone } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.currency = currency || user.currency;
    user.language = language || user.language;
    user.timezone = timezone || user.timezone;

    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ message: "Profile updated successfully", user: userResponse });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Server error during profile update" });
  }
};

export const deleteUserAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required to delete account" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    await User.findByIdAndDelete(req.user.id);

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Server error during account deletion" });
  }
};


// ===============================
//  PASSWORD MANAGEMENT
// ===============================

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Server error during password change" });
  }
};

// @desc Forgot Password (Send Reset Token)
// @route POST /api/users/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Send password reset email
    await sendPasswordResetEmail(email, user.firstName, resetToken);

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Server error during password reset request" });
  }
};

// @desc Reset Password
// @route POST /api/users/reset-password/:token
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
};

// ===============================
//  USER STATISTICS
// ===============================

// @desc Get user statistics
// @route GET /api/users/stats
export const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("stats");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ stats: user.stats });
  } catch (error) {
    console.error("Get Stats Error:", error);
    res.status(500).json({ message: "Server error while fetching statistics" });
  }
};