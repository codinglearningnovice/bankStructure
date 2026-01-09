import express from "express";
import {
  getAllUserTransactions,
  getUserTransaction,
  initiatePaystackDeposit,
  internalTransfer,
  verifyPaystackDeposit,
  withdrawByPaystack,
} from "../../controllers/transactionController.js";

const router = express.Router();

router
  .post(
    "/initiate-paystack-deposit",
    /*validator(ValidationSchema.initiatePaystackDeposit), Auth(),*/ initiatePaystackDeposit
  )

  .post(
    "/verify-paystack-deposit",
    /*validator(ValidationSchema.verifyPaystackDeposit),Auth(),*/ verifyPaystackDeposit
  )

  .post(
    "/make-transfer",
    /*validator(ValidationSchema.makeInternalTransferSchema), Auth(),*/ internalTransfer
  )

  .post(
    "/make-withdrawal-by-paystack",
    /*validator(ValidationSchema.makeWithdrawalByPaystack), Auth(),*/ withdrawByPaystack
  )

  .get("/list", /* Auth(),*/ getAllUserTransactions)

  .get("/:id", /* Auth(),*/ getUserTransaction);

export default router;
