import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status-codes";
import { UserService } from "./user.service";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const userData = req.body || JSON.parse(req.body.data);
  const profileImage = req.file?.path;
  if (profileImage) {
    userData.profileImage = profileImage;
  }

  const payload = { ...userData };

  const result = await UserService.createUser(payload, user);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await UserService.getUserById(userId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getAllUsers(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const userId = req.params.id;
  const updateData = req.body || JSON.parse(req.body.data);
  const profileImage = req.file?.path;
  if (profileImage) {
    updateData.profileImage = profileImage;
  }

  const result = await UserService.updateUser(
    userId as string,
    updateData,
    user,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const user = req.user;
  await UserService.deleteUser(userId as string, user as any);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: null,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id as string;
  const result = await UserService.getMyProfile(userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  getMyProfile,
};
