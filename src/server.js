import express from "express";
import "dotenv/config";
import cors from "cors";
import ConnectDb from "./config/ConnectDb.js";
import mainWrapper from "./routes/mainWrapper.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cors());

mainWrapper(app);
app.get("/", (req, res) => {
  res.send("API is running...");
});



ConnectDb().then(() => {    
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});