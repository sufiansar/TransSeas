import { QuotationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateQuotationDto } from "./quotes.interface";
import { generateQuotationNumber } from "./quotesNumberGenerate";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { processQuotationItemsWithAI } from "./ai.service";

const createQuotation = async (data: CreateQuotationDto) => {
  const processedItems = await processQuotationItemsWithAI(data.items);

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findUnique({
      where: { id: data.projectId },
      include: { vendor: true, items: true },
    });

    if (!project) {
      throw new Error("Project not found");
    }

    const quotationNumber = await generateQuotationNumber(tx);

    if (
      project.vendorId &&
      data.vendorId &&
      project.vendorId !== data.vendorId
    ) {
      throw new Error("Vendor does not match the project's assigned vendor");
    }

    const quotation = await tx.quotation.create({
      data: {
        number: quotationNumber,
        projectId: project.id,
        vendorId: data.vendorId,
        validUntil: data.validUntil,
        totalAmount: data.totalAmount,
        deliveryTerms: data.deliveryTerms,
        paymentTerms: data.paymentTerms,
      },
    });

    const quotationItemsData = processedItems.map((item: any) => ({
      quotationId: quotation.id,
      itemId: item.itemId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    }));

    await tx.quotationItem.createMany({
      data: quotationItemsData,
    });

    return quotation;
  });
};

const getAllQuotations = async (
  query: Record<string, any>,
  user: JwtPayload,
) => {
  console.log("from getAll quotations service, user:", user);
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (
    !user.role ||
    ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)
  ) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to view quotations",
    );
  }

  const prismaQuery = new PrismaQueryBuilder(query).filter().sort().paginate();

  const [quotations, meta] = await Promise.all([
    prisma.quotation.findMany({
      ...prismaQuery.build(),
      include: {
        project: {
          include: {
            items: { select: { id: true, item_name: true, qty: true } },
            vendor: { select: { id: true, name: true, companyName: true } },
          },
        },
      },
    }),
    prisma.quotation.count({
      where: prismaQuery.build().where,
    }),
    prismaQuery.getMeta(prisma.quotation),
  ]);

  return {
    data: quotations,
    meta,
  };
};

const quotationStatusUpdate = async (
  quotationId: string,
  status: QuotationStatus,
  user: JwtPayload,
) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to update quotation status",
    );
  }
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });

  if (!quotation) {
    throw new AppError(HttpStatus.NOT_FOUND, "Quotation not found");
  }

  const updatedQuotation = await prisma.quotation.update({
    where: { id: quotationId },
    data: { status },
  });

  return updatedQuotation;
};

const compareQuotations = async (projectId: string) => {
  // Get Approved Quotations with Items
  const quotations = await prisma.quotation.findMany({
    where: {
      projectId,
      status: "APPROVED",
    },
    include: {
      vendor: {
        select: {
          id: true,
          companyName: true,
        },
      },
      quotationItems: true,
    },
  });

  if (!quotations.length) {
    return [];
  }

  // 2️⃣ Collect ALL unique items across all vendors
  const itemMap = new Map<string, any>();

  quotations.forEach((quote) => {
    quote.quotationItems.forEach((item) => {
      if (!itemMap.has(item.itemId)) {
        itemMap.set(item.itemId, {
          itemId: item.itemId,
          itemName: item.item_name,
          itemCode: item.item_code,
          description: item.description,
        });
      }
    });
  });

  const allItems = Array.from(itemMap.values());

  // 3️⃣ Build comparison
  const comparison = allItems.map((item) => {
    const vendorData = quotations.map((quote) => {
      const matched = quote.quotationItems.find(
        (qi) => qi.itemId === item.itemId,
      );

      if (!matched) {
        return {
          vendorId: quote.vendor?.id,
          vendorName: quote.vendor?.companyName,
          status: "MISSING",
        };
      }

      return {
        vendorId: quote.vendor?.id,
        vendorName: quote.vendor?.companyName,
        unitPrice: matched.unitPrice,
        quantity: matched.qty,
        subtotal: matched.subtotalPrice,
        total: matched.totalPrice,
        remarks: matched.remarks,
      };
    });

    return {
      ...item,
      vendors: vendorData,
    };
  });

  return comparison;
};

const getQuotationById = async (quotationId: string, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to view this quotation",
    );
  }
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
    include: {
      project: {
        include: {
          items: { select: { id: true, item_name: true, qty: true } },
          vendor: { select: { id: true, name: true, companyName: true } },
        },
      },
      quotationItems: {
        include: {
          item: {
            select: {
              item_name: true,
              qty: true,
            },
          },
        },
      },
    },
  });

  if (!quotation) {
    throw new AppError(HttpStatus.NOT_FOUND, "Quotation not found");
  }

  return quotation;
};

const deleteQuotation = async (quotationId: string, user: JwtPayload) => {
  if (!user || !user.id) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "You are not authorized to delete this quotation",
    );
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });

  if (!quotation) {
    throw new AppError(HttpStatus.NOT_FOUND, "Quotation not found");
  }

  await prisma.quotation.delete({
    where: { id: quotationId },
  });
};

export const QuotationService = {
  createQuotation,
  getAllQuotations,
  quotationStatusUpdate,
  compareQuotations,
  getQuotationById,
  deleteQuotation,
};
