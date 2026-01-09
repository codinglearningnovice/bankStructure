import * as yup from "yup";

const handleErrorSchema = yup.object({
  message: yup.string().required(),
  statusCode: yup.number().positive().integer().default(400),
});

const handleSuccessSchema = yup.object({
  message: yup.string().required(),
  data: yup.object().default({}),
  statusCode: yup.number().positive().integer().default(200),
});

const generateCodeSchema = yup.object({
  num: yup.number().positive().integer().default(15),
});

const getBankNameSchema = yup.object({
  bankCode: yup.string().required(),
});

export {
  handleErrorSchema,
  handleSuccessSchema,
  generateCodeSchema,
  getBankNameSchema,
};
