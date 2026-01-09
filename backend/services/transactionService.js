import pkg from "@prisma/client"
import { v4 as uuidv4 } from 'uuid'
import {TransactionTypes,TransactionStatus,TransactionGateWay} from "../enums/transactionEnum.js"
const {PrismaClient} = pkg

const prisma = new PrismaClient

const transactionRepository = {
    async fetchTransactionByReference(reference){
        return await prisma.transaction.findUnique({where: { reference }})
    
  },

  async depositByPaystack(data){

    const deposit = {
      ...data,
      type: TransactionTypes.DEPOSIT,
      detail: {
        ...data.detail,
        gateway: TransactionGateWay.PAYSTACK
      },
      status: TransactionStatus.IN_PROGRESS
    } 
    return await prisma.transaction.create({data:deposit})
  },

  async generatePaymentReference(){
    return uuidv4();
  },
  
  async setStatus(transactionId, status   , options={}) {
     return await prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
      ...options 
    })
  },

  async processInternalTransfer(data, options = {}) {
    const record  = {
      ...data,
      type: TransactionTypes.TRANSFER,
      reference: generatePaymentReference(),
      detail: {
        ...data.detail,
        gateway: TransactionGateWay.NONE
      },
      status: TransactionStatus.COMPLETED
    } 
    return await prisma.transaction.create({data:record,...options})
  },

  async processExternalTransfer(data , options={}) {
    const record  = {
      ...data,
      type: TransactionTypes.TRANSFER,
      detail: {
        ...data.detail,
      },
      status: TransactionStatus.IN_PROGRESS
    } 
    return await prisma.transaction.create({data:record,...options})
  },


  async getTransactionsByField(record){
    const query = {where:{...record} };
    return await prisma.transaction.findMany(query)
  },

  async getTransactionByField(record){
    const query = {where:{...record} }
    return await prisma.transaction.findFirst(query)
  },

  async getTransactionSum(field, record = {}) {
    const result = await prisma.transaction.aggregate({
      where: { ...record },
      _sum: {
        [field]: true
      }
    });
    return result._sum[field] || 0;
  }

}

export default transactionRepository;



