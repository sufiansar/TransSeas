import { UserRole } from "@prisma/client";
import dbConfig from "../../config/db.config";
import { prisma } from "../../config/prisma";
import { deleteFromS3 } from "../../config/s3Bucket";
import AppError from "../../errorHelpers/AppError";
import { IUser, IUserUpdate } from "./user.interface";
import bcrypt from "bcryptjs";
import HttpStatus from "http-status";
import { th } from "zod/locales";
import { deleteImageFromCLoudinary } from "../../config/clodinary.config";
const createUser = async (userData: IUser, user: any) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new AppError(HttpStatus.CONFLICT, "User already exists");
  }

  //  Vendor & Procurement Team cannot create users
  if (
    user.role === UserRole.VENDOR ||
    user.role === UserRole.PROCUREMENT_TEAM
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not allowed to create users",
    );
  }

  //  Only SUPER_ADMIN can create SUPER_ADMIN
  if (
    userData.role === UserRole.SUPER_ADMIN &&
    user.role !== UserRole.SUPER_ADMIN
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only SUPER_ADMIN can create another SUPER_ADMIN",
    );
  }

  //  Only SUPER_ADMIN can create ADMIN
  if (userData.role === UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only SUPER_ADMIN can create an ADMIN",
    );
  }

  const hashedPassword = await bcrypt.hash(
    userData.passwordHash,
    Number(dbConfig.bcryptJs_salt),
  );

  const newUser = await prisma.user.create({
    data: {
      name: userData.name || null,
      companyName: userData.companyName || null,
      email: userData.email,
      passwordHash: hashedPassword,
      phone: userData.phone,
      role: userData.role || UserRole.VENDOR,
      commonditiId: userData?.commonditiId || null,
      address: userData.address || null,
      country: userData.country || null,
      city: userData.city || null,
      profileImage: userData.profileImage || null,
      categoryId: userData.categoryId || null,
      website: userData.website || null,
      isVerified: userData.isVerified ?? false,
      isActive: userData.isActive ?? true,
    },
  });

  return newUser;
};

const getUserById = async (userId: string) => {
  if (!userId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User ID is required");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const getAllUsers = async (currentUser: any) => {
  //These roles see nobody
  if (
    currentUser.role === UserRole.PROCUREMENT_TEAM ||
    currentUser.role === UserRole.VENDOR
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not allowed to view users",
    );
  }

  //SUPER_ADMIN sees everyone
  if (currentUser.role === UserRole.SUPER_ADMIN) {
    return prisma.user.findMany();
  }

  // ADMIN sees only vendor + procurement team
  if (currentUser.role === UserRole.ADMIN) {
    return prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.VENDOR, UserRole.PROCUREMENT_TEAM],
        },
      },
    });
  }

  throw new AppError(HttpStatus.FORBIDDEN, "Access denied");
};

const updateUser = async (
  userId: string,
  updateData: IUserUpdate,
  user: any,
) => {
  if (!userId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User ID is required");
  }

  const isSelfUpdate = user.id === userId;

  const isAdmin =
    user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

  // 🚫 Only admins can update other users
  if (!isSelfUpdate && !isAdmin) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not allowed to update other users",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // 🚫 Users cannot change their own role
  if (isSelfUpdate && updateData.role) {
    throw new AppError(HttpStatus.FORBIDDEN, "You cannot change your own role");
  }

  // 🚫 Optional: only admins can change status
  if (updateData.userStatus && !isAdmin) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only admins can change user status",
    );
  }

  // 🔐 Hash password if provided
  if (updateData.passwordHash) {
    updateData.passwordHash = await bcrypt.hash(
      updateData.passwordHash,
      Number(dbConfig.bcryptJs_salt),
    );
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  // 🧹 Clean up old profile image
  if (updateData.profileImage && existingUser.profileImage) {
    try {
      await deleteFromS3(existingUser.profileImage);
      await deleteImageFromCLoudinary(existingUser.profileImage);
    } catch (err) {
      console.error("Failed to delete old image:", err);
    }
  }

  return updatedUser;
};

const deleteUser = async (
  userId: string,
  currentUser: { id: string; role: UserRole },
) => {
  if (!userId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User ID is required");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;

  // 🚫 Only ADMIN or SUPER_ADMIN can delete users
  if (!isAdmin && !isSuperAdmin) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not allowed to delete users",
    );
  }

  // 🚫 ADMIN cannot delete SUPER_ADMIN
  if (isAdmin && targetUser.role === UserRole.SUPER_ADMIN) {
    throw new AppError(HttpStatus.FORBIDDEN, "ADMIN cannot delete SUPER_ADMIN");
  }

  // ⚠️ Prevent deleting last SUPER_ADMIN
  if (targetUser.role === UserRole.SUPER_ADMIN) {
    const superAdminCount = await prisma.user.count({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (superAdminCount <= 1) {
      throw new AppError(
        HttpStatus.FORBIDDEN,
        "At least one SUPER_ADMIN must remain in the system",
      );
    }
  }

  // 🧹 Remove profile image
  if (targetUser.profileImage) {
    try {
      await deleteFromS3(targetUser.profileImage);
      await deleteImageFromCLoudinary(targetUser.profileImage);
    } catch (err) {
      console.error("Failed deleting image:", err);
    }
  }

  await prisma.user.delete({
    where: { id: userId },
  });
};

const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  return user;
};
export const UserService = {
  createUser,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  getMyProfile,
};
