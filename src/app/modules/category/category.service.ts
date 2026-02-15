import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { JwtPayload } from "jsonwebtoken";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";

export const createCategory = async (
  user: JwtPayload,
  payload: { name: string },
) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (!payload.name) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Category name is required");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  const category = await prisma.category.create({
    data: {
      name: payload.name,
    },
  });
  return category;
};

export const getAllCategories = async (user: JwtPayload, query: any) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to view categories",
    );
  }
  const prismaQuery = new PrismaQueryBuilder(query)
    .filter()
    .search(["name"])
    .sort()
    .paginate();

  const builtQuery = prismaQuery.build();
  const categories = await prisma.category.findMany({
    ...builtQuery,
  });
  const meta = await prismaQuery.getMeta(prisma.category);
  return { data: categories, meta };
};

export const getCategoryById = async (user: JwtPayload, categoryId: string) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to view this category",
    );
  }
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      vendors: { select: { id: true, name: true, companyName: true } },
    },
  });
  return category;
};

export const updateCategory = async (
  user: JwtPayload,
  categoryId: string,
  payload: { name?: string },
) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to update this category",
    );
  }
  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      name: payload.name,
    },
  });
  return category;
};

export const deleteCategory = async (user: JwtPayload, categoryId: string) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to delete this category",
    );
  }
  const category = await prisma.category.delete({
    where: { id: categoryId },
  });
  return category;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
