// utils/index.utils.js
import { createLogger, format, transports } from "winston";
import { BANKS } from "../enums/payeeEnum.js";
import {
  handleErrorSchema,
  generateCodeSchema,
  getBankNameSchema,
} from "../validators/utilityValidators.js";

const printRed = (text) => {
  if (typeof text !== "string") {
    throw new Error("printRed expects a string");
  }
  console.log("\x1b[31m%s\x1b[0m", `${text} \n`);
};

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(
          (info) => `${info.timestamp} ${info.level} : ${info.message}`
        )
      ),
    }),
  ],
});

const escapeHtml = (html) => {
  if (typeof html !== "string") {
    throw new Error("escapeHtml expects a string");
  }
  return html.replace(/[&<>"']/g, "");
};

const isEmpty = (data) => {
  return (
    !data ||
    data.length === 0 ||
    typeof data === "undefined" ||
    data === null ||
    Object.keys(data).length === 0
  );
};

const handleError = async (res, message, statusCode = 400) => {
  try {
    const validated = await handleErrorSchema.validate({ message, statusCode });
    logger.log({ level: "error", message: validated.message });
    return res.status(validated.statusCode).json({
      status: false,
      message: validated.message,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Validation error: " + error.message,
    });
  }
};

const handleSuccess = (res, message, data = {}, statusCode = 200) => {
  if (!res || typeof res.status !== "function") {
    throw new Error("handleSuccess requires a valid Express response object");
  }
  if (typeof message !== "string") {
    throw new Error("handleSuccess message must be a string");
  }
  if (typeof statusCode !== "number") {
    throw new Error("handleSuccess statusCode must be a number");
  }

  return res
    .status(statusCode)
    .json({ status: true, message, data: { ...data } });
};

const generateCode = async (num = 15) => {
  const validated = await generateCodeSchema.validate({ num });
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  let result = randomness + dateString;
  result =
    result.length > validated.num ? result.substring(0, validated.num) : result;
  return result.toUpperCase();
};

const parseToObject = (value) => {
  if (typeof value !== "string") {
    throw new Error("parseToObject expects a string");
  }

  try {
    let counter = 0;
    let data = JSON.parse(value);
    while (counter <= 2) {
      if (typeof data === "object") {
        break;
      } else {
        data = JSON.parse(data);
        counter++;
      }
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }
};

const getBankName = async (bankCode) => {
  const validated = await getBankNameSchema.validate({ bankCode });
  const filter = BANKS.filter((item) => item.code === validated.bankCode);
  if (filter.length > 0) {
    return filter[0].name;
  }
  return "";
};

const utility = {
  printRed,
  handleError,
  handleSuccess,
  generateCode,
  isEmpty,
  escapeHtml,
  parseToObject,
  getBankName,
};

export default utility;
