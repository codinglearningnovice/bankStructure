import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const accountRespository = {
  async generateAccountNumber() {
    let accountNumber = "";
    for (let i = 0; i < 10; i++) {
      accountNumber += Math.floor(Math.random() * 10);
    }
    return accountNumber;
  },

  async createAccountNumber() {
    let accountNo = "";
    while (accountNo == "") {
      const result = this.generateAccountNumber();
      const exist = await prisma.account.findOne({
        where: { accountNumber: result },
        raw: true,
      });
      if (!exist) {
        accountNo = result;
        break;
      }
    }
    return accountNo;
  },

  async getAccounts(field) {
    const query = { where: field, raw: true };
    return prisma.account.findAll(query);
  },

  async createAccount(data) {
    const record = {
      ...data,
      accountNumber: await this.createAccountNumber(),
      balance: 0.0,
      status: AccountStatus.ACTIVE,
    };
    return prisma.account.create(record);
  },

  async getAccountsByUserId(userId) {
    const query = {
      where: { userId },
      raw: true,
    };
    return prisma.account.findAll(query);
  },

  async getAccountByField(record) {
    const query = {
      where: { ...record },
      raw: true,
    };
    return prisma.account.findOne(query);
  },

  async topUpBalance(accountId, amount, options = {}) {
    return await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: amount,
        },
      },
      ...options,
    });
  },

  async deductBalance(accountId, amount, options = {}) {
    return await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: {
          decrement: amount,
        },
      },
      ...options,
    });
  },
};

export default accountRespository;
