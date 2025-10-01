import express from "express";
import "dotenv/config";
import cors from "cors";
import ConnectDb from "./config/ConnectDb.js";
import mainWrapper from "./routes/mainWrapper.routes.js";

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());

mainWrapper(app);



ConnectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});