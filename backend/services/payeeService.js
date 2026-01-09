import pkg from "@prisma/client";

const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const payeeRespository = {

    
  async fetchPayeeByAccountNumberAndBank(accountNumber, bankCode) {
    const query = { where: { accountNumber, bankCode }, raw: true };
    return await prisma.payee.findOne(query);
  },

  async savePayeeRecord(data) {
    const record = {
      ...data,
      detail: {
        ...data.detail,
      },
    };
    return await prisma.payee.create(record);
  },

  async getPayeeByField(record) {
    const query = { where: { ...record }, raw: true };
    return await prisma.payee.findOne(query);
  },

  async getPayeesByUserId(userId) {
    const query = { where: { userId }, raw: true };
    return await prisma.payee.findMany(query);
  },
};

export default payeeRespository;
