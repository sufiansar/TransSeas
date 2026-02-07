// import { prisma } from "../../config/prisma";
import bcrypt from "bcryptjs";
import Jwt, { JwtPayload } from "jsonwebtoken";
import dbConfig from "../../config/db.config";
import { createUserToken } from "../../utility/userToken";
import AppError from "../../errorHelpers/AppError";
import httpStatus from "http-status";
import { addForgotPasswordJob } from "../../bullMQ/queues/mailQueues";
import { prisma } from "../../config/prisma";

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
    isUserExit.name,
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

export const AuthService = {
  loginUser,
  changeUserPassword,
  resetPassword,
  forgotPassword,
  getme,
};
