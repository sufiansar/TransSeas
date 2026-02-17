import { UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import {
  VendorFilterableFields,
  VendorSearchableFields,
} from "./vendor.constant";
import { IUser } from "../user/user.interface";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import dbConfig from "../../config/db.config";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";

const addVendor = async (userData: IUser, user: JwtPayload) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new AppError(HttpStatus.CONFLICT, "Vendor already exists");
  }

  const rawPassword =
    userData.passwordHash || process.env.DEFAULT_VENDOR_PASSWORD;

  const hashedPassword = await bcrypt.hash(
    rawPassword!,
    Number(dbConfig.bcryptJs_salt),
  );

  // Only ADMIN & SUPER_ADMIN can create vendors
  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only admin or super admin can create vendors",
    );
  }

  const newVendor = await prisma.user.create({
    data: {
      name: userData.name || null,
      companyName: userData.companyName || null,
      email: userData.email,
      passwordHash: hashedPassword,
      phone: userData.phone,
      role: UserRole.VENDOR,
      additionalPhone: userData.additionalPhone || null,
      address: userData.address || "example address",
      country: userData.country || "example country",
      city: userData.city || "example city",
      commoditiId: userData.commoditiId || null,
      designation: userData.designation || "example designation",
      website: userData.website || null,
      isVerified: userData.isVerified ?? true,
      isActive: userData.isActive ?? true,
    },
  });

  return newVendor;
};

const getAllVendors = async (query: any) => {
  const prismaQuery = new PrismaQueryBuilder(query);

  const builtQuery = prismaQuery
    .filter(VendorFilterableFields)
    .search(VendorSearchableFields)
    .fields()
    .sort()
    .paginate()
    .build();

  const [data, meta] = await Promise.all([
    prisma.user.findMany({
      ...builtQuery,
      include: {
        category: { select: { name: true } },
      },
    }),
    prismaQuery.getMeta(prisma.user),
  ]);

  return { data, meta };
};

const getVendorById = async (vendorId: string) => {
  if (!vendorId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Vendor ID is required");
  }
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId, role: UserRole.VENDOR },
  });
  if (!vendor) {
    throw new AppError(HttpStatus.NOT_FOUND, "Vendor not found");
  }
  return vendor;
};

const updateVendor = async (
  vendorId: string,
  updateData: any,
  user: JwtPayload,
) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can update vendors",
    );
  }

  const existingVendor = await prisma.user.findUnique({
    where: { id: vendorId, role: UserRole.VENDOR },
  });
  if (!existingVendor) {
    throw new AppError(HttpStatus.NOT_FOUND, "Vendor not found");
  }

  const updatedVendor = await prisma.user.update({
    where: { id: vendorId },
    data: updateData,
  });

  return updatedVendor;
};

const deleteVendor = async (vendorId: string, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can delete vendors",
    );
  }

  const existingVendor = await prisma.user.findUnique({
    where: { id: vendorId, role: UserRole.VENDOR },
  });
  if (!existingVendor) {
    throw new AppError(HttpStatus.NOT_FOUND, "Vendor not found");
  }
  const deletedVendor = await prisma.user.delete({
    where: { id: vendorId },
  });
  return deletedVendor;
};

export const VendorService = {
  getAllVendors,
  getVendorById,
  addVendor,
  updateVendor,
  deleteVendor,
};
