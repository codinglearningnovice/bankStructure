import express from "express";
import {
  applyLoan,
  createAccount,
  getAllUserAccounts,
  getAllUserLoan,
  getAllUserPayee,
  getUserAccount,
  getUserPayee,
} from "../../controllers/accountController.js";

const router = express.Router();

router
  .post("/create-account", createAccount)
  .post("/apply-for-loan", applyLoan)
  .get("/account-list", getAllUserAccounts)
  .get("/:id", getUserAccount)
  .get("/payee/list", getAllUserPayee)
  .get("/payee/:id", getUserPayee)
  .get("/apply-for-loan", applyLoan)
  .get("/loan/list", getAllUserLoan);

export default router;
