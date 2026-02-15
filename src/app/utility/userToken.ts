import AppError from "../errorHelpers/AppError";
import HttpStatus from "http-status";
import { generateToken } from "./jwt";
import dbConfig from "../config/db.config";
import { User } from "@prisma/client";
export const createUserToken = (user: Partial<User>) => {
  if (!user || !user.id || !user.email || !user.role) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "User payload is missing required fields",
    );
  }

  const jwtPayload = {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };

  if (!dbConfig.jwt.accessToken_secret) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "JWT access token secret is not configured",
    );
  }

  if (!dbConfig.jwt.refreshToken_secret) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "JWT refresh token secret is not configured",
    );
  }

  console.log("before The genereate token", dbConfig.jwt.accessToken_secret);
  const accessToken = generateToken(
    jwtPayload,
    dbConfig.jwt.accessToken_secret,
    dbConfig.jwt.accessToken_expiresIn as string,
  );

  const refreshToken = generateToken(
    jwtPayload,
    dbConfig.jwt.refreshToken_secret,
    dbConfig.jwt.refreshToken_expiresIn as string,
  );

  return {
    accessToken,
    refreshToken,
  };
};
