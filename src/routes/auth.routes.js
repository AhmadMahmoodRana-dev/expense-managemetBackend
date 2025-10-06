import express from "express"
import Register from "../controllers/user.controller.js";

const auth = express.Router();

auth.post("/auth/register", Register);

export default auth;