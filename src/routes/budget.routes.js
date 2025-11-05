



import express from "express"
import { protect, requireVerified } from "../middlewares/auth.middleware.js";
import { createBudget, getBudgets } from "../controllers/budget.controller.js";


const budget = express.Router();

budget.post('/add_budget',protect,requireVerified,createBudget)
budget.get('/get_budget',protect,requireVerified,getBudgets)


export default budget;        