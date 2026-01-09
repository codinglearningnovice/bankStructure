import moment from "moment";
import utility from "../utils/utilities.js";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Constants
export const TOKEN_EXPIRES = 5;
export const TokenTypes = {
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
};
export const TokenStatus = {
  NOTUSED: "NOTUSED",
  USED: "USED",
};

// Service
const tokenService = {
  async getTokenByField(record) {
    return await prisma.token.findFirst({
      where: record,
    });
  },

  async createForgotPasswordToken(email,user) {
    const tokenData = {
      key: email,
      type: TokenTypes.FORGOT_PASSWORD,
      expires: moment().add(TOKEN_EXPIRES, "minutes").toDate(),
      status: TokenStatus.NOTUSED,
      userId:user
    };

    return await this.createToken(tokenData);
  },

  async createToken(record) {
    const tokenData = { ...record };
    let validCode = false;

    while (!validCode) {
      tokenData.code = await utility.generateCode(6);
      console.log(`this is from tokenservice ${tokenData.code}`)
      const isCodeExist = await this.getTokenByField({ code: tokenData.code });
      

      if (!isCodeExist) {
        validCode = true;
        break;
      }
    }

    return await prisma.token.create({
      data: tokenData,
    });
  },

  async updateRecord(searchBy, record) {
    return await prisma.token.updateMany({
      where: searchBy,
      data: record,
    });
  },

  async markAsUsed(code) {
    return await this.updateRecord({ code }, { status: TokenStatus.USED });
  },
};

export default tokenService;
