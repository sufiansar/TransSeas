import { rfqStatus, UserRole } from "@prisma/client";
import { addRFQMailJob } from "../../bullMQ/queues/mailQueues";
import { prisma } from "../../config/prisma";
import { generateRFQEmail, generateRFQNumber } from "../../lib/generateEmail";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { RfqFilterableFields, RfqSearchableFields } from "./rfq.constant";
import { IRFQ } from "./rfq.interface";
import { handleRFQEmail } from "../../bullMQ/workers/mailWorkers";

const createRFQDto = async (data: IRFQ) => {
  if (!data.projectId) throw new Error("Project ID is required");
  if (!data.vendors?.length) throw new Error("At least one vendor is required");
  if (!data.items?.length) throw new Error("At least one item is required");

  const project = await prisma.project.findUnique({
    where: { id: data.projectId },
    select: { name: true, referenceNo: true },
  });
  if (!project) throw new Error("Project not found");

  // 1️⃣ Only DB operations inside transaction
  const { rfq, vendors, rfqNo, emailSubject, emailMessage } =
    await prisma.$transaction(async (tx) => {
      const vendors = await tx.user.findMany({
        where: {
          id: { in: data.vendors },
          role: UserRole.VENDOR,
          isActive: true,
        },
        select: { id: true, email: true, name: true, companyName: true },
      });

      if (!vendors.length) throw new Error("No valid vendors found");
      if (vendors.length !== data.vendors.length)
        throw new Error("Some selected users are not vendors");

      const rfqNo = await generateRFQNumber(tx);

      const { subject, body } = generateRFQEmail({
        rfqNo,
        dueDate: data.dueDate,
        terms: data.terms,
        projectName: project.name,
        referenceNo: project.referenceNo,
      });

      const emailSubject = data.emailSubject || subject;
      const emailMessage = data.emailMessage || body;

      const rfq = await tx.rFQ.create({
        data: {
          projectId: data.projectId,
          dueDate: data.dueDate,
          rfqNo,
          emailSubject,
          terms: data.terms,
          emailMessage,
          followUpEmail: data.followUpEmail,
          rfqStatus: data.rfqStatus || rfqStatus.SENT,
          vendors: { connect: data.vendors.map((id) => ({ id })) },
          items: { connect: data.items.map((id) => ({ id })) },
        },
      });

      return { rfq, vendors, rfqNo, emailSubject, emailMessage };
    });

  // 2️⃣ Send emails to all vendors using handleRFQEmail (concurrently)
  await Promise.all(
    vendors.map(async (vendor) => {
      try {
        await handleRFQEmail({
          email: vendor.email,
          companyName: vendor.companyName || vendor.name || "Valued Vendor",
          referenceNo: project.referenceNo,
          rfqNo,
          emailSubject,
          emailBody: emailMessage,
          itemIds: data.items,
        });
        console.log(`✉️ Email sent to ${vendor.email}`);
      } catch (err) {
        console.error(`❌ Failed to send email to ${vendor.email}:`, err);
      }
    }),
  );

  return rfq;
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
    // referenceNo: project?.referenceNo || "N/A",
  });

  return {
    rfqNo,
    projectName: project.name,
    dueDate,
    vendorEmails,
    emailPreview,
  };
};
const getRFQBYProjectId = async (projectId: string) => {
  // Get project with commodity name
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      commodity: { select: { name: true } }, // get commodity name from ID
    },
  });

  if (!project) throw new Error("Project not found");
  if (!project.commodity)
    throw new Error("Commodity not found for this project");

  const commodityName = project.commodity.name;

  // Get items by matching commodity name
  const items = await prisma.items.findMany({
    where: { commodity: commodityName }, // match by name
    select: { id: true, item_name: true, qty: true },
  });

  // Get vendors linked to this commodity (still by ID)
  const vendors = await prisma.user.findMany({
    where: { commoditiId: project.commodity.name },
    select: { id: true, name: true, companyName: true },
  });

  return { commodityName, items, vendors };
};
export const sendFollowUpToVendor = async (rfqId: string, vendorId: string) => {
  const rfq = await prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      vendors: {
        select: { id: true, email: true, name: true, companyName: true },
      },
      project: { select: { referenceNo: true } },
      items: { select: { id: true } },
    },
  });

  if (!rfq) throw new Error("RFQ not found");
  if (!rfq.followUpEmail) throw new Error("Follow-up email not found");

  const vendor = rfq.vendors.find((v) => v.id === vendorId);
  if (!vendor) throw new Error("Vendor not found in this RFQ");

  const followUpSubject = `${rfq.emailSubject} - Follow Up`;

  await addRFQMailJob(
    vendor.email,
    vendor.companyName || vendor.name || "Valued Vendor",
    rfq.project?.referenceNo || "N/A",
    rfq.rfqNo,
    followUpSubject,
    rfq.followUpEmail,
    rfq.terms as string,
    rfq.items.map((item) => item.id),
  );

  return { message: `Follow-up email sent to ${vendor.name}` };
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
      items: true,
      project: { select: { name: true } },
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
      items: true,
      project: { select: { name: true } },
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

  const project = await prisma.project.findUnique({
    where: { id: data.projectId || existingRFQ.projectId },
    select: { name: true, referenceNo: true },
  });
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
      projectName: project?.name || "Unknown Project",
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
          project?.referenceNo || "N/A",
          existingRFQ.rfqNo,
          emailSubject,
          data.terms as string,
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
  getRFQBYProjectId,
};
