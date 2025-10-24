import express from "express"
import { protect, requireVerified } from "../middlewares/auth.middleware.js";
import { activateCategory, createCategory, deleteCategory, getCategories, getCategoriesByType, inactivateCategory, updateCategory } from "../controllers/category.controller.js";


const category = express.Router();

category.post('/add_categories',protect,requireVerified,createCategory)
category.get('/categories/:type',protect,requireVerified,getCategoriesByType)
category.put('/categories/:id',protect,requireVerified,updateCategory)
category.put('/activateCategory/:id',protect,requireVerified,activateCategory)
category.put('/inactivateCategory/:id',protect,requireVerified,inactivateCategory)
category.delete('/categories/:id',protect,requireVerified,deleteCategory)
category.get('/allCategories',protect,requireVerified,getCategories)


export default category;        