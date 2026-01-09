import accountRespository from "../services/accountService.js"
import transactionRepository from "../services/transactionService.js"
import utility from "../utils/utilities.js";
import permissions from "../permission/index.js";
import { ResponseCode } from "../enums/codeEnums.js";
import { TransactionGateWay,TransactionStatus } from "../enums/transactionEnum.js";
import pkg from "@prisma/client"
import payeeRespository from "../services/payeeService.js";
import paymentService from "../services/paymentService.js";
const {PrismaClient} = pkg
const prisma = new PrismaClient

export const deposit = async (
  accountId,
  transactionId,
  amount
) => {
    try {
    
    const result = await prisma.$transaction(async (tx) => {
     
      await accountRespository.topUpBalance(accountId, amount, { tx })
      
      
      await transactionRepository.setStatus(
        transactionId,
        TransactionStatus.COMPLETED,
        { tx }
      )
      
      return true
    })
    
    return result
  } catch (error) {
    console.error('Deposit error:', error)
    return false
  }
};
export const transfer = async (senderAccount, receiverAccount, amount) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      await accountRespository.deductBalance(senderAccount.id, amount, { tx });

      
      await accountRespository.topUpBalance(receiverAccount.id, amount, { tx });

      const newTransaction = {
        userId: senderAccount.userId,
        accountId: senderAccount.id,
        amount,
        detail: {
          receiverAccountNumber: receiverAccount.accountNumber, 
        },
      };

      const transfer = await transactionRepository.processInternalTransfer(
        newTransaction,
        { tx }
      );

      return transfer;
    });

    return { status: true, transaction: result };
  } catch (error) {
    console.error("Transfer error:", error);
    return { status: false, transaction: null };
  }
};
export const transferToExternalAccount = async (
  senderAccount,
  receiverAccount,
  reference,
  amount
) => {
try {
  const result  = await prisma.$transaction(async(tx)=>{
    await accountRespository.deductBalance(senderAccount.id, amount, {
      transaction: tx,
    });
    const newTransaction = {
      userId: senderAccount.userId,
      reference,
      accountId: senderAccount.id,
      amount,
      detail: {
        recieverAccountNumber: receiverAccount.accountNumber,
        gateway: TransactionGateWay.PAYSTACK,
      },
    };

    let transfer = await transactionRepository.processExternalTransfer(
      newTransaction,
      { transaction: tx }
    );
   return transfer
  })
  
  return { status: true, transaction: result };
} catch (error) {
  console.error("Transfer error:", error);
  return { status: false, transaction: null };
}
};
export const initiatePaystackDeposit = async (req, res) => {try {
      const params = { ...req.body };
      const depositInfo = await paymentService.generatePaystackPaymentUrl(params.user.email, params.amount);
      if (!depositInfo) {
        return utility.handleError(res, "Paystack payment not available , try again in few seconds", ResponseCode.NOT_FOUND);
      }
      const newTransaction = {
        userId: params.user.id,
        accountId: params.accountId,
        amount: params.amount,
        reference: depositInfo.reference,
        detail: {}
      }
      let deposit = await transactionRepository.depositByPaystack(newTransaction);
      return utility.handleSuccess(res, "Transaction created successfully", { transaction: deposit, url: depositInfo.authorization_url }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }
};
export const verifyPaystackDeposit = async(req,res)=>{
 try {
      const params = { ...req.body };
      let transaction = await transactionRepository.fetchTransactionByReference(params.reference);
      if (!transaction) {
        return utility.handleError(res, "Invalid transaction reference", ResponseCode.NOT_FOUND);
      }

      if (transaction.status != TransactionStatus.IN_PROGRESS) {
        return utility.handleError(res, "Transaction status not supported", ResponseCode.NOT_FOUND);
      }

      const isValidPaymentTx = await paymentService.verifyPaystackPayment(params.reference, transaction.amount);
      if (!isValidPaymentTx) {
        return utility.handleError(res, "Invalid transaction reference", ResponseCode.NOT_FOUND);
      }

      const deposit = await deposit(transaction.accountId, transaction.id, transaction.amount);
      if (!deposit) {
        return utility.handleError(res, "Deposit failed", ResponseCode.NOT_FOUND);

      }

      return utility.handleSuccess(res, "Deposit was completed successfully", { transaction }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}
export const internalTransfer = async(req,res)=>{
try {
      const params = { ...req.body };
      const senderAccount = await accountRespository.getAccountByField({ id: params.senderAccountId });
      if (!senderAccount) {
        return utility.handleError(res, "Invalid sender account", ResponseCode.NOT_FOUND);
      }

      if (senderAccount.balance < params.amount) {
        return utility.handleError(res, "Insufficient balance to complete this transfer", ResponseCode.BAD_REQUEST);
      }


      if (params.amount <= 0) {
        return utility.handleError(res, "Amount must be above zero", ResponseCode.BAD_REQUEST);
      }

      const receiverAccount = await accountRespository.getAccountByField({ accountNumber: params.recieverAccountNumber });
      if (!receiverAccount) {
        return utility.handleError(res, "Invalid receiver account", ResponseCode.NOT_FOUND);
      }

      if (senderAccount.userId == receiverAccount.userId) {
        return utility.handleError(res, "User can not transfer to his own account ", ResponseCode.NOT_FOUND);
      }

      const result = await transfer(senderAccount, receiverAccount, params.amount);
      if (!result.status) {
        return utility.handleError(res, "Internal transfer failed", ResponseCode.BAD_REQUEST);
      }

      return utility.handleSuccess(res, "Transfer was completed successfully", { transaction: result.transaction }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}
export const withdrawByPaystack = async(req,res)=>{
try {
      const params = { ...req.body };
      const senderAccount = await accountRespository.getAccountByField({ id: params.senderAccountId });
      if (!senderAccount) {
        return utility.handleError(res, "Invalid sender account", ResponseCode.NOT_FOUND);
      }

      if (senderAccount.balance < params.amount) {
        return utility.handleError(res, "Insufficient balance to complete this transfer", ResponseCode.BAD_REQUEST);
      }

      if (params.amount <= 0) {
        return utility.handleError(res, "Amount must be above zero", ResponseCode.BAD_REQUEST);
      }

      let payeeRecord = await payeeRespository.fetchPayeeByAccountNumberAndBank(params.recieverAccountNumber , params.bankCode);
      let recipientID = "";
      if(!payeeRecord){
        const paystackPayeeRecord = {
          accountNumber:params.recieverAccountNumber,
          accountName:params.receiverAccountName,
          bankCode:params.bankCode
        }
          recipientID = (await paymentService.createPaystackRecipient(paystackPayeeRecord)) ;
          if(recipientID){
            payeeRecord = await payeeRespository.savePayeeRecord({
              userId:params.user.id,
              accountNumber:params.recieverAccountNumber,
              accountName:params.receiverAccountName,
              bankCode:params.bankCode,
              detail:{
                paystackRecipientId:recipientID
              }
            })
          }else{
        return utility.handleError(res, "Invalid payment account , please try another payout method", ResponseCode.BAD_REQUEST);
            
          }
      }else{
        recipientID = payeeRecord.detail.paystackRecipientId ;
      }

      const transferData = await paymentService.initiatePaystackTransfer(recipientID , params.amount , params.message);
      if(!transferData){
        return utility.handleError(res, "Paystack transfer failed", ResponseCode.BAD_REQUEST);
      }

      const result = await transferToExternalAccount(senderAccount , params.recieverAccountNumber , transferData.reference , params.amount);
      if(!result.status){
        return utility.handleError(res, "Withdrawal transaction failed", ResponseCode.BAD_REQUEST);
      }
   
      return utility.handleSuccess(res, "Transfer was initialized successfully", { transaction: result.transaction }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}
export const getAllUserTransactions = async(req,res)=>{
try {
      const params = { ...req.body };
      let filter = {} ;
      filter.userId = params.user.id;
      if(params.accountId){
        filter.accountId = params.accountId
      }
      let transactions = await transactionRepository.getTransactionsByField(filter)
      return utility.handleSuccess(res, "Transactions fetched successfully", { transactions }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}
export const getUserTransaction = async(req,res)=>{
try {
      const params = { ...req.params };
      let transaction = await transactionRepository.getTransactionByField({ id:utility.escapeHtml(params.id) });
      if (!transaction) {
        return utility.handleError(res, "Transaction does not exist", ResponseCode.NOT_FOUND);
      }
      return utility.handleSuccess(res, "Transaction fetched successfully", { transaction }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}
export const getAllUserTransactionsAdmin = async(req,res)=>{
try {
      const admin = {...req.body.user}
      const permission = permissions.can(admin.role).readAny('transactions');
      if (!permission) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }
      let filter = {} ;
      let transactions = await transactionRepository.getTransactionsByField({ ...filter });
      return utility.handleSuccess(res, "Transaction fetched successfully", { transactions }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

}