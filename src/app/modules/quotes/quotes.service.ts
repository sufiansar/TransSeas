import { QuotationStatus, UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { CreateQuotationDto } from "./quotes.interface";
import { generateQuotationNumber } from "./quotesNumberGenerate";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";

const createQuotation = async (data: CreateQuotationDto) => {
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
      },
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
            items: { select: { id: true, itemTitle: true, quantity: true } },
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
  //Get all project items
  const projectItems = await prisma.items.findMany({
    where: { projectId },
  });

  // Get all approved quotations
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

  //Build comparison structure
  const comparison = projectItems.map((item) => {
    const vendorPrices = quotations.map((quote) => {
      const matchedItem = quote.quotationItems.find(
        (qi) => qi.itemId === item.id,
      );

      if (!matchedItem) {
        return {
          vendorId: quote?.vendor?.id,
          vendorName: quote?.vendor?.companyName,
          status: "MISSING",
        };
      }

      return {
        vendorId: quote?.vendor?.id,
        vendorName: quote?.vendor?.companyName,
        unitPrice: matchedItem.unitPrice,
        quantity: matchedItem.quantity,
        total: matchedItem.unitPrice * matchedItem.quantity,
      };
    });

    return {
      itemId: item.id,
      itemTitle: item.itemTitle,
      quantity: item.quantity,
      vendors: vendorPrices,
    };
  });

  return comparison;
};

export const QuotationService = {
  createQuotation,
  getAllQuotations,
  quotationStatusUpdate,
  compareQuotations,
};
