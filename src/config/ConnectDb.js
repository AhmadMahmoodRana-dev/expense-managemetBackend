import mongoose from "mongoose";
import "dotenv/config";

const ConnectDb = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@expensemanagement.hozpet7.mongodb.net/?retryWrites=true&w=majority&appName=expenseManagement`
    );
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed", error);
    process.exit(1);
  }
};

export default ConnectDb;
