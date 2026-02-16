import { prisma } from "../../config/prisma";
import { CreateQuotationDto } from "./quotes.interface";
import { generateQuotationNumber } from "./quotesNumberGenerate";

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
        vendorid: data.vendorId,
      },
    });

    return quotation;
  });
};

export const QuotationService = {
  createQuotation,
};
