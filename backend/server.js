import express from "express";
import cors from "cors";
import connectDB from "./config/dbConn.js";
import userRouter from "./routes//api/userRoute.js";
import adminRoute from "./routes/api/adminRoute.js";
import accountRoute from "./routes/api/accountRoute.js";
import transactionRoute from "./routes/api/transactionRoute.js";

import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use("/api", userRouter);
app.use("/api", adminRoute);
app.use("/api", accountRoute);
app.use("/api", transactionRoute);

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  connectDB();
  console.log(`Server is running on port: ${PORT}`);
});
