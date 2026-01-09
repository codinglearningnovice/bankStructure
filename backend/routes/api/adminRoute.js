import express from "express";
import { getAllUsersByAdmin } from "../../controllers/userController.js";
import { setAccountStatus } from "../../controllers/userController.js";
import { getSingleUserById } from "../../controllers/userController.js";
import {
  approveOrDeclineLoanByAdmin,
  getAllUserAccountsAdmin,
  getLoansAdmin,
  getUserAccountAdmin,
} from "../../controllers/accountController.js";
import { getAllUserTransactions } from "../../controllers/transactionController.js";

const router = express.Router();

router
  .get("/getallusers", getAllUsersByAdmin)
  .patch("/set-acc-status", setAccountStatus)
  .get("/user/:id", getSingleUserById)
  .get("/accounts", getAllUserAccountsAdmin)
  .get("/account/:id", getUserAccountAdmin)
  .get("/transactions", getAllUserTransactions)
  .get("/loans", getLoansAdmin)
  .post("/loans/approve-decline-loan", approveOrDeclineLoanByAdmin);

export default router;
