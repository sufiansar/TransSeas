import { rfqStatus, UserRole } from "@prisma/client";
import { addRFQMailJob } from "../../bullMQ/queues/mailQueues";
import { prisma } from "../../config/prisma";
import { generateRFQEmail, generateRFQNumber } from "../../lib/generateEmail";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { RfqFilterableFields, RfqSearchableFields } from "./rfq.constant";
import { IRFQ } from "./rfq.interface";

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
        rfqStatus: data.rfqStatus || rfqStatus.SENT,

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
export const previewRFQEmail = async (
  projectId: string,
  dueDate: Date,
  selectedVendorIds: string[],
) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true },
  });

  if (!project) throw new Error("Project not found");

  const vendors = await prisma.user.findMany({
    where: {
      id: { in: selectedVendorIds },
      role: UserRole.VENDOR,
      isActive: true,
    },
    select: { email: true },
  });

  if (!vendors.length) {
    throw new Error("No selected vendors found");
  }

  const rfqNo = await generateRFQNumber(prisma);

  const vendorEmails = vendors.map((v) => v.email);

  const emailPreview = await generateRFQEmail({
    rfqNo,
    dueDate,
    projectName: project.name,
  });

  return {
    rfqNo,
    projectName: project.name,
    dueDate,
    vendorEmails,
    emailPreview,
  };
};

const getAllRFQs = async (query: any) => {
  const prismaQuery = new PrismaQueryBuilder(query);
  const builtQuery = prismaQuery
    .filter(RfqFilterableFields)
    .search(RfqSearchableFields)
    .fields()
    .sort()
    .paginate()
    .build();
  const rfqs = await prisma.rFQ.findMany({
    ...builtQuery,
    include: {
      vendors: { select: { id: true, name: true, companyName: true } },
      items: { select: { id: true, itemTitle: true } },
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
      items: { select: { id: true, itemTitle: true } },
    },
  });
  return rfq;
};

const updateRFQ = async (rfqId: string, data: Partial<IRFQ>) => {
  const existingRFQ = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: { vendors: true, items: true },
  });

  if (!existingRFQ) throw new Error("RFQ not found");

  const projectName = data.projectId
    ? (
        await prisma.project.findUnique({
          where: { id: data.projectId },
          select: { name: true },
        })
      )?.name
    : undefined;
  const result = await prisma.$transaction(async (tx) => {
    let vendors: {
      id: string;
      email: string;
      name: string | null;
      companyName: string | null;
    }[] = existingRFQ.vendors.map((v) => ({
      id: v.id,
      email: v.email,
      name: v.name,
      companyName: v.companyName,
    }));
    if (data.vendors?.length) {
      vendors = await tx.user.findMany({
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
    }

    const { subject, body } = generateRFQEmail({
      rfqNo: existingRFQ.rfqNo,
      dueDate: data.dueDate ?? existingRFQ.dueDate,
      projectName,
    });

    const emailSubject = data.emailSubject || subject;
    const emailMessage = data.emailMessage || body;

    const rfq = await tx.rFQ.update({
      where: { id: rfqId },
      data: {
        projectId: data.projectId,
        dueDate: data.dueDate,
        emailSubject,
        emailMessage,
        followUpEmail: data.followUpEmail,

        vendors: data.vendors
          ? { set: data.vendors.map((id) => ({ id })) }
          : undefined,

        items: data.items
          ? { set: data.items.map((id) => ({ id })) }
          : undefined,
      },
    });

    await Promise.all(
      vendors.map((vendor) =>
        addRFQMailJob(
          vendor.email,
          vendor.companyName || vendor.name || "Valued Vendor",
          existingRFQ.rfqNo,
          emailSubject,
          emailMessage,
          data.items ?? [],
        ),
      ),
    );

    return rfq;
  });

  return result;
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
