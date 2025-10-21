import express from "express"
import { protect, requireVerified } from "../middlewares/auth.middleware.js";
import { createCategory, deleteCategory, getCategoriesByType, updateCategory } from "../controllers/category.controller.js";


const category = express.Router();

category.post('/add_categories',protect,requireVerified,createCategory)
category.get('/categories/:type',protect,requireVerified,getCategoriesByType)
category.put('/categories/:id',protect,requireVerified,updateCategory)
category.delete('/categories/:id',protect,requireVerified,deleteCategory)


export default category;        