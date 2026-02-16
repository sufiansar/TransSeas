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
    const item = await tx.items.create({
      data: {
        itemTitle: payload.itemTitle,
        quantity: payload.quantity,
        manufacturer: payload.manufacturer,
        itemcode: payload.itemcode,
        specifications: payload.specifications,
        price: payload.price,
        unit: payload.unit,
        status: payload.status,
        rfqId: payload.rfqId,
        projectId: payload.projectId,
        commonditiId: payload.commonditiId,
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

    await tx.project.update({
      where: { id: payload.projectId },
      data: { totalPrice: totalPrice },
    });

    return item;
  });
};

// const getAllItems = async (query: Record<string, any>, user: JwtPayload) => {
//   const queryBuilder = new PrismaQueryBuilder(query);
//   const itemsQuery = queryBuilder
//     .filter(ItemsFilterableFields)
//     .search(ItemsSearchableFields)
//     .fields()
//     .sort()
//     .paginate();
//   const [data, meta] = await Promise.all([
//     prisma.items.findMany({
//       ...itemsQuery.build(),
//       include: {
//         commodity: { select: { name: true } },
//         project: { select: { name: true } },
//       },
//     }),
//     queryBuilder.getMeta(prisma.items),
//   ]);
//   if (!user) {
//     throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
//   }

//   if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
//     throw new AppError(
//       HttpStatus.FORBIDDEN,
//       "Only ADMIN and SUPER_ADMIN can access items",
//     );
//   }
//   return {
//     data,
//     meta,
//   };
// };

const getAllItems = async (query: Record<string, any>, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can access items",
    );
  }

  const queryBuilder = new PrismaQueryBuilder(query);

  const builtQuery = queryBuilder
    .filter(ItemsFilterableFields) // scalar fields only
    .search(ItemsSearchableFields)
    .fields()
    .sort()
    .paginate()
    .build();

  const andConditions: any[] = [];

  // keep scalar filters from builder
  if (builtQuery.where) {
    andConditions.push(builtQuery.where);
  }

  //  filter by commodityId (foreign key)
  if (query.commodityId) {
    andConditions.push({
      commodityId: query.commodityId,
    });
  }

  // filter by projectId
  if (query.projectId) {
    andConditions.push({
      projectId: query.projectId,
    });
  }

  // filter by commodity name (relation)
  if (query.commodity) {
    andConditions.push({
      commodity: {
        name: {
          contains: query.commodity,
          mode: "insensitive",
        },
      },
    });
  }

  // filter by project name (relation)
  if (query.project) {
    andConditions.push({
      project: {
        name: {
          contains: query.project,
          mode: "insensitive",
        },
      },
    });
  }

  builtQuery.where = {
    AND: andConditions,
  };

  const [data, meta] = await Promise.all([
    prisma.items.findMany({
      ...builtQuery,
      include: {
        commodity: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    queryBuilder.getMeta(prisma.items),
  ]);

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
