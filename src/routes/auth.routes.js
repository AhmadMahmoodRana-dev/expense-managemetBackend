import express from "express"

const auth = express.Router();

auth.get("/auth/", (req, res) => {
  res.send("Auth Route");
});

export default auth;