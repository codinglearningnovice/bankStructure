import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
} from "../../controllers/userController.js";

const router = express.Router();

router
  .post("/register", register)
  .post("/login", login)
  .post("/forgotPassword", forgotPassword)
  .patch("/resetPassword", resetPassword)
  .get("/getProfile/:id", getProfile);

export default router;
