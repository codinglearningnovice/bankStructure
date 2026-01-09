
import jwt from "jsonwebtoken";
import utility from "../utils/utilities.js";
import { ResponseCode } from "../enums/codeEnums.js";
import userRepository from "../services/userService.js";
import { AccountStatus } from "../enums/accountEnum.js";
import { UserRoles } from "../enums/userEnum.js"; 

export const validator = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.validate(req.body, { abortEarly: false });
      next();
    } catch (error) {
      const errorMessage =
        error.errors && error.errors[0] ? error.errors[0] : error.message;
      return utility.handleError(res, errorMessage, ResponseCode.BAD_REQUEST);
    }
  };
};

export const Auth = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization ?? "";

      if (utility.isEmpty(authHeader)) {
        return utility.handleError(
          res,
          "Authorization token required",
          ResponseCode.UNAUTHORIZED
        );
      }

      // Extract token from "Bearer <token>"
      const token = authHeader.split(" ")[1];

      if (!token) {
        return utility.handleError(
          res,
          "Invalid authorization format",
          ResponseCode.UNAUTHORIZED
        );
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_KEY);

      if (!decoded || !decoded.id) {
        return utility.handleError(
          res,
          "Invalid token",
          ResponseCode.UNAUTHORIZED
        );
      }

      // Fetch user from database
      const user = await userRepository.getUserByField({ id: decoded.id });

      if (!user) {
        return utility.handleError(
          res,
          "User not found",
          ResponseCode.UNAUTHORIZED
        );
      }

      // Check account status
      if (user.accountStatus === AccountStatus.DELETED) {
        return utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.FORBIDDEN
        );
      }

      if (user.accountStatus === AccountStatus.SUSPENDED) {
        return utility.handleError(
          res,
          "Account suspended",
          ResponseCode.FORBIDDEN
        );
      }

      if (user.accountStatus === AccountStatus.FROZEN) {
        return utility.handleError(
          res,
          "Account frozen",
          ResponseCode.FORBIDDEN
        );
      }

      // Attach user to request
      req.body.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      };

      next();
    } catch (error) {
      // Handle JWT specific errors
      if (error.name === "JsonWebTokenError") {
        return utility.handleError(
          res,
          "Invalid token",
          ResponseCode.UNAUTHORIZED
        );
      }

      if (error.name === "TokenExpiredError") {
        return utility.handleError(
          res,
          "Token expired",
          ResponseCode.UNAUTHORIZED
        );
      }

      return utility.handleError(res, error.message, ResponseCode.UNAUTHORIZED);
    }
  };
};

export const AdminAuth = () => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization ?? "";

      if (utility.isEmpty(authHeader)) {
        return utility.handleError(
          res,
          "Authorization token required",
          ResponseCode.UNAUTHORIZED
        );
      }

      const token = authHeader.split(" ")[1];

      if (!token) {
        return utility.handleError(
          res,
          "Invalid authorization format",
          ResponseCode.UNAUTHORIZED
        );
      }

      const decoded = jwt.verify(token, process.env.JWT_KEY);

      if (!decoded || !decoded.id) {
        return utility.handleError(
          res,
          "Invalid token",
          ResponseCode.UNAUTHORIZED
        );
      }

      const user = await userRepository.getUserByField({ id: decoded.id });

      if (!user) {
        return utility.handleError(
          res,
          "User not found",
          ResponseCode.UNAUTHORIZED
        );
      }

      // Check if user is admin
      if (user.role !== UserRoles.ADMIN) {
        return utility.handleError(
          res,
          "Access denied. Admin privileges required",
          ResponseCode.FORBIDDEN
        );
      }

      // Check account status
      if (user.accountStatus === AccountStatus.DELETED) {
        return utility.handleError(
          res,
          "Account does not exist",
          ResponseCode.FORBIDDEN
        );
      }

      if (user.accountStatus === AccountStatus.SUSPENDED) {
        return utility.handleError(
          res,
          "Account suspended",
          ResponseCode.FORBIDDEN
        );
      }

      if (user.accountStatus === AccountStatus.FROZEN) {
        return utility.handleError(
          res,
          "Account frozen",
          ResponseCode.FORBIDDEN
        );
      }

      req.body.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
      };

      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return utility.handleError(
          res,
          "Invalid token",
          ResponseCode.UNAUTHORIZED
        );
      }

      if (error.name === "TokenExpiredError") {
        return utility.handleError(
          res,
          "Token expired",
          ResponseCode.UNAUTHORIZED
        );
      }

      return utility.handleError(res, error.message, ResponseCode.UNAUTHORIZED);
    }
  };
};

// Optional: Combined middleware for DRY principle
export const authenticate = async (req, res, next, requireAdmin = false) => {
  try {
    const authHeader = req.headers.authorization ?? "";

    if (utility.isEmpty(authHeader)) {
      return utility.handleError(
        res,
        "Authorization token required",
        ResponseCode.UNAUTHORIZED
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return utility.handleError(
        res,
        "Invalid authorization format",
        ResponseCode.UNAUTHORIZED
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);

    if (!decoded || !decoded.id) {
      return utility.handleError(
        res,
        "Invalid token",
        ResponseCode.UNAUTHORIZED
      );
    }

    const user = await userRepository.getUserByField({ id: decoded.id });

    if (!user) {
      return utility.handleError(
        res,
        "User not found",
        ResponseCode.UNAUTHORIZED
      );
    }

    // Check admin requirement
    if (requireAdmin && user.role !== UserRoles.ADMIN) {
      return utility.handleError(
        res,
        "Access denied. Admin privileges required",
        ResponseCode.FORBIDDEN
      );
    }

    // Check account status
    if (user.accountStatus === AccountStatus.DELETED) {
      return utility.handleError(
        res,
        "Account does not exist",
        ResponseCode.FORBIDDEN
      );
    }

    if (user.accountStatus === AccountStatus.SUSPENDED) {
      return utility.handleError(
        res,
        "Account suspended",
        ResponseCode.FORBIDDEN
      );
    }

    if (user.accountStatus === AccountStatus.FROZEN) {
      return utility.handleError(res, "Account frozen", ResponseCode.FORBIDDEN);
    }

    req.body.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return utility.handleError(
        res,
        "Invalid token",
        ResponseCode.UNAUTHORIZED
      );
    }

    if (error.name === "TokenExpiredError") {
      return utility.handleError(
        res,
        "Token expired",
        ResponseCode.UNAUTHORIZED
      );
    }

    return utility.handleError(res, error.message, ResponseCode.UNAUTHORIZED);
  }
};