import pkg from "@prisma/client"

import {LoanStatus} from "../enums/loanEnum.js"

const {PrismaClient} = pkg

const prisma = new PrismaClient
const loanRepository = {
  async getLoanByField(record) {
    return await prisma.loan.findFirst({
      where: { ...record },
    });
  },

  async createLoan(data) {
    const record = {
      ...data,
      status: LoanStatus.PENDING,
    };
    return await prisma.loan.create({
      data: record, 
    });
  },

  async getLoansByUserId(userId) {
    return await prisma.loan.findMany({
      where: { userId },
     
    });
  },

  async getLoans() {
    return await prisma.loan.findMany({
      where: {},
    
    });
  },

  async updateRecord(searchBy, record) {
    return await prisma.loan.update({
      where: { ...searchBy },
      data: { record },
    });
  },

  
};

export default loanRepository