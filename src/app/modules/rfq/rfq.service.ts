import { addRFQMailJob } from "../../bullMQ/queues/mailQueues";
import { prisma } from "../../config/prisma";
import { generateRFQEmail, generateRFQNumber } from "../../lib/generateEmail";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { IRFQ } from "./rfq.interface";

import { UserRole } from "@prisma/client";

const createRFQDto = async (data: IRFQ) => {
  if (!data.projectId) throw new Error("Project ID is required");
  if (!data.vendors?.length) throw new Error("At least one vendor is required");
  if (!data.items?.length) throw new Error("At least one item is required");
  const projectName = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { name: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const vendors = await tx.user.findMany({
      where: {
        id: { in: data.vendors },
        role: UserRole.VENDOR,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
      },
    });

    if (!vendors.length) throw new Error("No valid vendors found");
    if (vendors.length !== data.vendors.length) {
      throw new Error("Some selected users are not vendors");
    }

    const rfqNo = await generateRFQNumber(tx);

    const { subject, body } = generateRFQEmail({
      rfqNo,
      dueDate: data.dueDate,
      projectName: projectName?.name,
    });

    const emailSubject = data.emailSubject || subject;
    const emailMessage = data.emailMessage || body;

    const rfq = await tx.rFQ.create({
      data: {
        projectId: data.projectId,
        dueDate: data.dueDate,
        rfqNo,
        emailSubject,
        emailMessage,
        followUpEmail: data.followUpEmail,

        vendors: {
          connect: data.vendors.map((id) => ({ id })),
        },
        items: {
          connect: data.items.map((id) => ({ id })),
        },
      },
    });

    await Promise.all(
      vendors.map((vendor) =>
        addRFQMailJob(
          vendor.email,
          vendor.companyName || vendor.name || "Valued Vendor",
          rfqNo,
          emailSubject,
          emailMessage,
          data.items,
        ),
      ),
    );

    return rfq;
  });

  return result;
};

export const previewRFQEmail = async (projectId: string, dueDate: Date) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const rfqNo = await generateRFQNumber(prisma);

  return generateRFQEmail({
    rfqNo,
    dueDate,
    projectName: project.name,
  });
};

const getAllRFQs = async (query: any) => {
  const prismaQuery = new PrismaQueryBuilder(query);
  const builtQuery = prismaQuery
    .filter(["projectId", "dueDate"])
    .search(["rfqNo"])
    .fields()
    .sort()
    .paginate()
    .build();
  const rfqs = await prisma.rFQ.findMany({
    ...builtQuery,
    include: {
      vendors: { select: { id: true, name: true, companyName: true } },
      items: { select: { id: true, name: true } },
    },
  });
  const meta = await prismaQuery.getMeta(prisma.rFQ);
  return { data: rfqs, meta };
};

const getRFQById = async (rfqId: string) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      vendors: { select: { id: true, name: true, companyName: true } },
      items: { select: { id: true, name: true } },
    },
  });
  return rfq;
};

const updateRFQ = async (rfqId: string, data: Partial<IRFQ>) => {
  const updatedRFQ = await prisma.rFQ.update({
    where: { id: rfqId },
    data: {
      projectId: data.projectId,
      dueDate: data.dueDate,
      emailSubject: data.emailSubject,
      emailMessage: data.emailMessage,
      followUpEmail: data.followUpEmail,

      vendors: data.vendors
        ? {
            set: data.vendors.map((id) => ({ id })),
          }
        : undefined,

      items: data.items
        ? {
            set: data.items.map((id) => ({ id })),
          }
        : undefined,
    },
  });

  return updatedRFQ;
};

const deleteRFQ = async (rfqId: string) => {
  return await prisma.$transaction(async (tx) => {
    await tx.rFQ.update({
      where: { id: rfqId },
      data: {
        vendors: { set: [] },
        items: { set: [] },
      },
    });

    return tx.rFQ.delete({
      where: { id: rfqId },
    });
  });
};

export const RFQService = {
  createRFQDto,
  previewRFQEmail,
  getAllRFQs,
  getRFQById,
  updateRFQ,
  deleteRFQ,
};
