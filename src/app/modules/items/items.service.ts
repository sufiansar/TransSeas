import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import AppError from "../../errorHelpers/AppError";
import { CreateItemDTO } from "./items.interface";
import HttpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ItemsFilterableFields, ItemsSearchableFields } from "./items.constant";

export const createItem = async (payload: CreateItemDTO) => {
  if (payload.quantity <= 0) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Quantity must be greater than zero",
    );
  }

  if (payload.rfqId) {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: payload.rfqId },
    });
    if (!rfq) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Invalid RFQ ID");
    }
  }

  return prisma.$transaction(async (tx) => {
    //  Create item
    const item = await tx.items.create({
      data: {
        itemTitle: payload.itemTitle,
        quantity: payload.quantity,
        menufacturer: payload.menufacturer,
        itemcode: payload.itemcode,
        specifications: payload.specifications,
        price: payload.price,
        unit: payload.unit,
        status: payload.status,
        rfqId: payload.rfqId,
        projectId: payload.projectId,
      },
    });

    //Recalculate total project price INLINE
    const items = await tx.items.findMany({
      where: { projectId: payload.projectId },
      select: {
        quantity: true,
        price: true,
      },
    });

    const totalPrice = items.reduce(
      (sum, item) => sum + (item.price || 0) * item.quantity,
      0,
    );

    // Update project total
    await tx.project.update({
      where: { id: payload.projectId },
      data: { priceLevel: totalPrice },
    });

    return item;
  });
};

const getAllItems = async (query: Record<string, any>, user: JwtPayload) => {
  const queryBuilder = new PrismaQueryBuilder(query);
  const itemsQuery = queryBuilder
    .filter(ItemsFilterableFields)
    .search(ItemsSearchableFields)
    .fields()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    prisma.items.findMany({
      ...itemsQuery.build(),
    }),
    queryBuilder.getMeta(prisma.items),
  ]);
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can access items",
    );
  }
  return {
    data,
    meta,
  };
};

export const getItemById = async (id: string) => {
  const item = await prisma.items.findUnique({
    where: { id },
  });
  if (!item) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }
  return item;
};

const updateItems = async (id: string, payload: any, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can update items",
    );
  }

  const existingItem = await prisma.items.findUnique({
    where: { id },
  });
  if (!existingItem) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }

  const updatedItem = await prisma.items.update({
    where: { id },
    data: payload,
  });
  return updatedItem;
};

const deleteItems = async (id: string, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can delete items",
    );
  }

  const existingItem = await prisma.items.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }

  await prisma.items.delete({
    where: { id },
  });

  return existingItem;
};
export const ItemsService = {
  createItem,
  getAllItems,
  getItemById,
  updateItems,
  deleteItems,
};
