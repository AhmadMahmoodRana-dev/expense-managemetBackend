import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    profilePhoto: {
      type: String, // URL to image
      default: null,
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "PKR", "AUD", "CAD", "JPY"],
    },
    language: {
      type: String,
      default: "en",
      enum: ["en", "es", "fr", "de", "ur", "hi"],
    },
    timezone: {
      type: String,
      default: "UTC",
    },

    // Settings
    settings: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      dateFormat: {
        type: String,
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
        default: "MM/DD/YYYY",
      },
      numberFormat: {
        type: String,
        enum: ["comma", "dot"],
        default: "comma",
      },
      startOfWeek: {
        type: String,
        enum: ["sunday", "monday"],
        default: "sunday",
      },
      notifications: {
        budgetAlerts: { type: Boolean, default: true },
        billReminders: { type: Boolean, default: true },
        transactionConfirmations: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        pushNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
      },
      security: {
        twoFactorEnabled: { type: Boolean, default: false },
        appLockEnabled: { type: Boolean, default: false },
        appLockType: {
          type: String,
          enum: ["pin", "biometric", "none"],
          default: "none",
        },
        autoLockTimeout: {
          type: Number,
          default: 5, // minutes
        },
        hideAmounts: { type: Boolean, default: false },
      },
    },

    // Statistics
    stats: {
      totalTransactions: { type: Number, default: 0 },
      memberSince: { type: Date, default: Date.now },
      lastLogin: { type: Date, default: Date.now },
      loginStreak: { type: Number, default: 0 },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;