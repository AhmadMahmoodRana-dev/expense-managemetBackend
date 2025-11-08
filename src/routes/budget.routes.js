import express from "express";
import { protect, requireVerified } from "../middlewares/auth.middleware.js";
import {createBudget,getBudgets,getBudgetsByMonth,getBudget,updateCategorySpent,getBudgetAlerts, deleteBudgetCategory} from "../controllers/budget.controller.js";

const budget = express.Router();

// =========================
// BUDGET ROUTES
// =========================

// Create a new budget
budget.post("/add_budget", protect, requireVerified, createBudget);
// Get all budgets (with pagination)
budget.get("/get_budget", protect, requireVerified, getBudgets);
// Get budgets by month & year
budget.get("/get_by_month", protect, requireVerified, getBudgetsByMonth);
// Get single budget by ID
budget.get("/:id", protect, requireVerified, getBudget);


// Update spent amount for a specific category inside a budget
budget.put("/:id/categories/:categoryId/spent", protect, requireVerified, updateCategorySpent);
budget.delete("/:id/categories/:categoryId/delete", protect, requireVerified, deleteBudgetCategory);
// Get budget alerts (overall + per category)
budget.get("/:id/alerts", protect, requireVerified, getBudgetAlerts);

export default budget;