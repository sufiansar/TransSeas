import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status";
import dbConfig from "../../config/db.config";
import { AuthService } from "./auth.service";
import { JwtPayload } from "jsonwebtoken";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const accessTokenExpireIn = dbConfig.jwt.accessToken_expiresIn as string;
  const refreshTokenExpireIn = dbConfig.jwt.refreshToken_expiresIn as string;

  const getMaxAge = (expiresIn: string) => {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));
    switch (unit) {
      case "y":
        return value * 365 * 24 * 60 * 60 * 1000;
      case "M":
        return value * 30 * 24 * 60 * 60 * 1000;
      case "w":
        return value * 7 * 24 * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "m":
        return value * 60 * 1000;
      case "s":
        return value * 1000;
      default:
        return 1000 * 60 * 60;
    }
  };

  const accessTokenMaxAge = getMaxAge(accessTokenExpireIn);
  const refreshTokenMaxAge = getMaxAge(refreshTokenExpireIn);

  const result = await AuthService.loginUser(req.body);
  const { accessToken, refreshToken, ...userData } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: accessTokenMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: refreshTokenMaxAge,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      ...userData,
      accessToken,
      refreshToken,
    },
  });
});

const logOUtUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

const changeUserPassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id; // Assuming user ID is available in req.user
  const { newPassword, oldPassword } = req.body;

  await AuthService.changeUserPassword(userId, newPassword, oldPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await AuthService.forgotPassword(email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset link sent to email successfully",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user;

  await AuthService.resetPassword(req.body, decodedToken as JwtPayload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Password Change  Succesfully",
    data: null,
  });
});

const getme = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const user = await AuthService.getme(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
});
export const AuthController = {
  loginUser,
  logOUtUser,
  changeUserPassword,
  forgotPassword,
  resetPassword,
  getme,
};
