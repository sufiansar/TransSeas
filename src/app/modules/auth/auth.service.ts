import bcrypt from "bcryptjs";
import Jwt, { JwtPayload } from "jsonwebtoken";
import dbConfig from "../../config/db.config";
import { createUserToken } from "../../utility/userToken";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status";
import {
  addForgotPasswordJob,
  addInviteUserJob,
} from "../../bullMQ/queues/mailQueues";
import { prisma } from "../../config/prisma";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import HttpStatus from "http-status";

interface LoginPayload {
  email: string;
  password: string;
}
const loginUser = async (payload: LoginPayload) => {
  const userData = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!userData) {
    throw new Error("Email And Password is incorrect");
  }

  if (userData.isActive === false) {
    throw new Error("User account is deactivated");
  }

  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.passwordHash,
  );
  if (!isCorrectPassword) {
    throw new Error("Password is incorrect");
  }
  console.log("Access token secret Login:", dbConfig.jwt.accessToken_secret);

  const accessToken = createUserToken(userData).accessToken;

  const refreshToken = createUserToken(userData).refreshToken;
  return { accessToken, refreshToken, user: userData };
};

const changeUserPassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const isOldPasswordCorrect = await bcrypt.compare(
    oldPassword,
    user.passwordHash,
  );
  if (!isOldPasswordCorrect) {
    throw new Error("Old password is incorrect");
  }
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(dbConfig.bcryptJs_salt),
  );

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hashedPassword },
  });
};

const resetPassword = async (
  payload: Record<string, any>,
  decodedToken: JwtPayload,
) => {
  const { newPassword } = payload;
  const email = decodedToken.email as string;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("User with the provided email does not exist.");
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(dbConfig.bcryptJs_salt),
  );

  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashedPassword },
  });
};

const forgotPassword = async (email: string) => {
  const isUserExit = await prisma.user.findUnique({ where: { email } });

  if (!isUserExit) {
    throw new AppError(httpStatus.BAD_REQUEST, "User does not exist", "");
  }

  // if (!isUserExit.isVerified) {
  //   throw new AppError(httpStatus.FORBIDDEN, "User Not Verified", "");
  // }

  const jwtPayload = {
    userId: isUserExit.id,
    email: isUserExit.email,
    role: isUserExit.role,
  };

  const resetLink = Jwt.sign(
    jwtPayload,
    dbConfig.jwt.accessToken_secret as string,
    {
      expiresIn: "5m",
    },
  );

  const resetUILink = `${dbConfig.frontEnd_url}/reset-Password?id=${isUserExit.id}&token=${resetLink}`;

  const result = await addForgotPasswordJob(
    isUserExit.email,
    isUserExit.name as string,

    resetUILink,
  );
  console.log("Forgot password job added to queue:", result);
  return result;
};

const getme = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
    },
  });
  return user;
};

const createInvite = async (email: string, role: UserRole, user: any) => {
  if (user.role === UserRole.VENDOR) {
    throw new AppError(HttpStatus.FORBIDDEN, "Not allowed to invite users");
  }

  if (role === UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only SUPER_ADMIN can invite ADMIN",
    );
  }

  const token = crypto.randomUUID();

  const invite = await prisma.invite.create({
    data: {
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await addInviteUserJob(
    email,
    `${dbConfig.frontEnd_url}/invite?token=${token}`,
    role,
  );

  return {
    invite,
    link: `${dbConfig.frontEnd_url}/invite?token=${token}`,
  };
};

const verifyInvite = async (token: string) => {
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite || invite.used) throw new AppError(400, "Invalid invite");

  if (invite.expiresAt < new Date()) throw new AppError(400, "Invite expired");

  return invite;
};

const acceptInvite = async (token: string, name: string, password: string) => {
  const invite = await prisma.invite.findUnique({ where: { token } });

  if (!invite || invite.used) throw new AppError(400, "Invalid invite");

  if (invite.expiresAt < new Date()) throw new AppError(400, "Invite expired");

  const hashedPassword = await bcrypt.hash(
    password,
    Number(dbConfig.bcryptJs_salt),
  );

  const user = await prisma.user.create({
    data: {
      name,
      email: invite.email,
      passwordHash: hashedPassword,
      role: invite.role,
      isVerified: true,
      isActive: true,
    },
  });

  await prisma.invite.update({
    where: { id: invite.id },
    data: { used: true },
  });

  return user;
};

export const AuthService = {
  loginUser,
  changeUserPassword,
  resetPassword,
  forgotPassword,
  createInvite,
  verifyInvite,
  getme,
  acceptInvite,
};
