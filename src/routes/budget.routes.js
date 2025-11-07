



import express from "express"
import { protect, requireVerified } from "../middlewares/auth.middleware.js";
import { createBudget, getBudgets, getBudgetsByMonth } from "../controllers/budget.controller.js";


const budget = express.Router();

budget.post('/add_budget',protect,requireVerified,createBudget)
budget.get('/get_budget',protect,requireVerified,getBudgets)
budget.get('/get_by_month',protect,requireVerified,getBudgetsByMonth)

export default budget;        