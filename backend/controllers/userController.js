import { AccountStatus, EmailStatus, UserRoles } from "../enums/userEnum.js";
import bcrypt from "bcryptjs";
import userRepository from "../services/userService.js";
import utility from "../utils/utilities.js";
import { ResponseCode } from "../enums/codeEnums.js";
import JWT from "jsonwebtoken";
import tokenService from "../services/tokenService.js";
import emailService from "../services/emailService.js";
import { TokenStatus } from "../services/tokenService.js";
import { TOKEN_EXPIRES } from "../services/tokenService.js";
import { TokenTypes } from "../services/tokenService.js";
import permissions from "../permission/index.js";

export const register = async (req, res) => {
  try {
    const params = { ...req.body };

    const hashedpasword = bcrypt.hashSync(params.password, 10);

    const normalizedEmail = params.email.trim().toLowerCase();

    const newUser = {
      firstname: params.firstname.trim(),
      lastname: params.lastname.trim(),
      email: normalizedEmail,
      username: params.email.split("@")[0],
      password: hashedpasword,
      role: UserRoles.CUSTOMER,
      isEmailVerified: EmailStatus.NOT_VERIFIED,
      accountStatus: AccountStatus.ACTIVE,
    };
    let userExists = await userRepository.findByEmail(normalizedEmail);
    if (userExists) {
      return utility.handleError(
        res,
        "Email already exists",
        ResponseCode.ALREADY_EXIST
      );
    }

    let user = await userRepository.createUser(newUser);
    return utility.handleSuccess(
      res,
      "User registered successfully",
      { user },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const login = async (req, res) => {
  try {
    const params = { ...req.body };

    const normalizedEmail = params.email.trim().toLowerCase();
    const isEmail = normalizedEmail.includes("@");

    let user = await userRepository.findByField(
      isEmail ? { email: normalizedEmail } : { username: normalizedEmail }
    );
    if (!user) {
      return utility.handleError(
        res,
        "Invalid login detail",
        ResponseCode.NOT_FOUND
      );
    }

    let isPasswordMatch = await bcrypt.compare(params.password, user.password);

    if (!isPasswordMatch) {
      return utility.handleError(
        res,
        "Invalid login detail",
        ResponseCode.NOT_FOUND
      );
    }

    const token = JWT.sign(
      {
        firstname: user.firstname,
        lastname: user.lastname,
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_KEY,
      {
        expiresIn: "30d",
      }
    );
    return utility.handleSuccess(
      res,
      "Login Successful",
      { user, token },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const params = { ...req.body };

    let user = await userRepository.findByField({ email: params.email });

    if (!user) {
      return utility.handleError(
        res,
        "Account does not exist",
        ResponseCode.NOT_FOUND
      );
    }

    const token = await tokenService.createForgotPasswordToken(
      params.email,
      user.id
    );
    console.log(token);
    await emailService.sendForgotPasswordMail(params.email, token.code);
    return utility.handleSuccess(
      res,
      "Password reset code has been sent to your mail ",
      {},
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const params = { ...req.body };
    let isValidToken = await tokenService.getTokenByField({
      key: params.email,
      code: params.code,
      type: TokenTypes.FORGOT_PASSWORD,
      status: TokenStatus.NOTUSED,
    });
    if (!isValidToken) {
      return utility.handleError(
        res,
        "Token has expired",
        ResponseCode.NOT_FOUND
      );
    }

    if (
      isValidToken &&
      moment(isValidToken.expires).diff(moment(), "minute") <= 0
    ) {
      return utility.handleError(
        res,
        "Token has expired",
        ResponseCode.NOT_FOUND
      );
    }

    let user = await userRepository.findByField({ email: params.email });
    if (!user) {
      return utility.handleError(
        res,
        "Invalid User Record",
        ResponseCode.NOT_FOUND
      );
    }

    const _password = bcrypt.hashSync(params.password, 10);

    await userRepository.updateData({ id: user.id }, { password: _password });
    await tokenService.updateRecord(
      { id: isValidToken.id },
      { status: TokenStatus.USED }
    );

    return utility.handleSuccess(
      res,
      "Password reset successful ",
      {},
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const getAllUsersByAdmin = async (req, res) => {
  try {
    const admin = { ...req.body.user };
    const permission = permissions.can(admin.role).readAny("users");
    if (!permission.granted) {
      return utility.handleError(
        res,
        "Invalid Permission",
        ResponseCode.NOT_FOUND
      );
    }

    let users = await userRepository.findAll();
    if (users && users.length > 0) {
      users = users.map((item) => {
        item.password = "";
        return item;
      });
    }
    return utility.handleSuccess(
      res,
      "Users fetched successfully",
      { users },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const getSingleUserById = async (req, res) => {
  try {
    const params = { ...req.params };
    const admin = { ...req.body.user };
    const permission = permissions.can(admin.role).readAny("users");
    if (!permission.granted) {
      return utility.handleError(
        res,
        "Invalid Permission",
        ResponseCode.NOT_FOUND
      );
    }
    let user = await userRepository.findByField({
      id: utility.escapeHtml(params.id),
    });
    if (!user) {
      return utility.handleError(
        res,
        "User does not exist",
        ResponseCode.NOT_FOUND
      );
    }
    user.password = "";
    return utility.handleSuccess(
      res,
      "User fetched successfully",
      { user },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const setAccountStatus = async (req, res) => {
  try {
    const params = { ...req.body };
    const admin = { ...req.body.user };
    const permission = permissions.can(admin.role).updateAny("users");
    if (!permission.granted) {
      return utility.handleError(
        res,
        "Invalid Permission",
        ResponseCode.NOT_FOUND
      );
    }

    let user = await userRepository.findByField({ id: params.userId });
    if (!user) {
      return utility.handleError(
        res,
        "Invalid User Record",
        ResponseCode.NOT_FOUND
      );
    }

    await userRepository.updateData(
      { id: user.id },
      { accountStatus: params.status }
    );
    return utility.handleSuccess(
      res,
      "Account status updated successful ",
      {},
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};

export const getProfile = async (req, res) => {
  try {
    const params = { ...req.body };
    let user = await this.userService.getUserByField({ id: params.user.id });
    if (!user) {
      return utility.handleError(
        res,
        "User does not exist",
        ResponseCode.NOT_FOUND
      );
    }
    user.password = "";
    return utility.handleSuccess(
      res,
      "User fetched successfully",
      { user },
      ResponseCode.SUCCESS
    );
  } catch (error) {
    return utility.handleError(res, error.message, ResponseCode.SERVER_ERROR);
  }
};
