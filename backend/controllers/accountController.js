import { ResponseCode } from "../enums/codeEnums.js";
import permissions from "../permission/index.js";
import accountRespository from "../services/accountService.js";
import loanRepository from "../services/loanService.js";
import payeeRespository from "../services/payeeService.js";
import utility from "../utils/utilities.js";

export const createAccount = async (req, res) => {
  try {
    const params = { ...req.body };
    const newAccount = { userId: params.user.id };
    let account = await accountRespository.createAccount(newAccount);
    return utility.handleSuccess(
      res,
      "Account created sucessfully",
      { account },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const getAllUserAccounts = async (req, res) => {
  try {
    const params = { ...req.body };
    let accounts = await accountRespository.getAccountsByUserId(params.user.id);
    return utility.handleSuccess(
      res,
      "Account fetched successfully",
      { accounts },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const getUserAccount = async(req,res)=>{
    try {
        const params = { ...req.params };
        let account = await accountRespository.getAccountByField({
          id: utility.escapeHtml(params.id),
        });
        if (!account) {
          return utility.handleError(
            res,
            "Account does not exist",
            ResponseCode.NOT_FOUND
          );
        }
        return utility.handleSuccess(
          res,
          "Account fetched successfully",
          { account },
          ResponseCode.SUCCESS
        );

    } catch (error) {
        return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }
}

export const getAllUserPayee = async(req, res)=> {
    try {
      const params = { ...req.body };
      let payees = await payeeRespository.getPayeesByUserId(params.user.id);
      return utility.handleSuccess(res, "Payees fetched successfully", { payees }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }
  }

  export const getUserPayee = async(req,res) =>{
try {
    const params = { ...req.params };
    let payee = await payeeRespository.getPayeeByField({
      id: utility.escapeHtml(params.id),
    });
    if (!payee) {
      return utility.handleError(
        res,
        "Payee does not exist",
        ResponseCode.NOT_FOUND
      );
    }
    return utility.handleSuccess(
      res,
      "Payee fetched successfully",
      { payee },
      ResponseCode.SUCCESS
    );

} catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
}
  }

  export const getAllUserAccountsAdmin = async(req,res)=>{
    try {
      //const params = { ...req.body };
      const admin = {...req.body.user}
      const permission = permissions.can(admin.role).readAny('accounts');
      if (!permission.granted) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }
      let accounts = await accountRespository.getAccounts();
      return utility.handleSuccess(res, "Account fetched successfully", { accounts }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

  }
  export const getUserAccountAdmin = async(req,res)=>{
    try {
      const params = { ...req.params };
      const admin = {...req.body.user}
      const permission = permissions.can(admin.role).readAny('accounts');
      if (!permission) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }
      let account = await accountRespository.getAccountByField({id:utility.escapeHtml(params.id)});
      if (!account) {
        return utility.handleError(res, "Account does not exist", ResponseCode.NOT_FOUND);
      }
      return utility.handleSuccess(res, "Account fetched successfully", { account }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

  }

  export const applyLoan = async(req,res)=>{
try {
      const params = { ...req.body };
      let loanExists = await loanRepository.getLoanByField({ accountId: params.accountId, status: LoanStatus.PENDING });
      if (loanExists) {
        return utility.handleError(res, "You already have a loan pending on this account", ResponseCode.NOT_FOUND);
      }

     loanExists = await loanRepository.getLoanByField({ accountId: params.accountId, status: LoanStatus.ACTIVE });
      if (loanExists) {
        return utility.handleError(res, "You already have a loan active on this account", ResponseCode.NOT_FOUND);
      }

      let account = await accountRespository.getAccountByField({ id: params.accountId });
      if (!account) {
        return utility.handleError(res, "Account does not exist", ResponseCode.NOT_FOUND);
      }

      if (account.userId != params.user.id) {
        return utility.handleError(res, "Account does not belong to owner", ResponseCode.NOT_FOUND);
      }

      const totalAmountTransacted = await this.transactionService.getTransactionSum('amount', { userId: params.user.id, accountId: params.accountId });
      const minRequiredTransaction = totalAmountTransacted * LoanMinimumTransactionPercent;
      if (minRequiredTransaction > params.amount) {
        return utility.handleError(res, "You are not eligible for this loan", ResponseCode.NOT_FOUND);
      }
      const newLoan = {
        userId: params.user.id,
        accountId: params.accountId,
        amount: params.amount,
        interest: LoanInterest
      } 

      let loan = await loanRepository.createLoan(newLoan);
      return utility.handleSuccess(res, "Loan created successfully", { loan }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

  }
  export const getAllUserLoan = async(req,res)=>{
 try {
      const params = { ...req.body }
      let loans = await loanRepository.getLoansByUserId(params.user.id);
      return utility.handleSuccess(res, "Loans fetched successfully", { loans }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

  }
  export const getLoansAdmin = async(req,res)=>{
try {
      const params = { ...req.params };
      const admin = { ...req.body.user }
      const permission = permissions.can(admin.role).readAny('loans');
      if (!permission.granted) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }
      let loans = await loanRepository.getLoans();
      return utility.handleSuccess(res, "Loans fetched successfully", { loans }, ResponseCode.SUCCESS);
    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }

  }
  export const approveOrDeclineLoanByAdmin= async(req,res)=>{
try {
      const params = { ...req.body }
      const admin = { ...req.body.user }
      const permission = permissions.can(admin.role).updateAny('loans');
      if (!permission.granted) {
        return utility.handleError(res, 'Invalid Permission', ResponseCode.NOT_FOUND);
      }

      let loan = await loanRepository.getLoanByField({ id: params.loanId });
      if (!loan) {
        return utility.handleError(res, 'Invalid loan Record', ResponseCode.NOT_FOUND);
      }

      if (loan.status != LoanStatus.PENDING) {
        return utility.handleError(res, 'Loan has already been processed', ResponseCode.NOT_FOUND);
      }

      await loanRepository.updateRecord({ id: loan.id }, { status: params.status });
      if (params.status == LoanStatus.ACTIVE) {
        await accountRespository.topUpBalance(loan.accountId, loan.amount);
      }
      return utility.handleSuccess(res, "Loan status updated successful ", {}, ResponseCode.SUCCESS);

    } catch (error) {
      return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
    }
  }

  
