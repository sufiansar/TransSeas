import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";

const createCommodity = async (data: ICommondity, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to create commodities",
    );
  }
  const commodity = await prisma.commodity.create({
    data,
  });
  return commodity;
};

const getAllCommodities = async (query: any, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to view commodities",
    );
  }
  const prismaQuery = new PrismaQueryBuilder(query)
    .filter()
    .search(["name"])
    .sort()
    .paginate();
  const builtQuery = prismaQuery.build();
  const commodities = await prisma.commodity.findMany(builtQuery);
  const meta = await prismaQuery.getMeta(prisma.commodity);
  return { data: commodities, meta };
};

const getCommodityById = async (id: string, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to view commodities",
    );
  }
  const commodity = await prisma.commodity.findUnique({
    where: { id },
  });
  if (!commodity) {
    throw new AppError(HttpStatus.NOT_FOUND, "Commodity not found");
  }
  return commodity;
};

const updateCommodity = async (
  id: string,
  data: ICommondityUpdate,
  user: JwtPayload,
) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to update commodities",
    );
  }
  const commodity = await prisma.commodity.update({
    where: { id },
    data,
  });
  return commodity;
};
const deleteCommodity = async (id: string, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.UNAUTHORIZED,
      "You are not authorized to delete commodities",
    );
  }
  const commodity = await prisma.commodity.delete({
    where: { id },
  });
  return commodity;
};

export const CommodityService = {
  createCommodity,
  getAllCommodities,
  getCommodityById,
  updateCommodity,
  deleteCommodity,
};
