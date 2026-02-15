interface RFQEmailPayload {
  rfqNo: string;
  projectName?: string;
  dueDate: Date;
}

interface RFQEmailPayload {
  rfqNo: string;
  companyName?: string;
  dueDate: Date;
  email?: string[];
  projectName?: string;
}

export const generateRFQEmail = ({
  rfqNo,
  companyName,
  email,
  dueDate,
  projectName,
}: RFQEmailPayload) => {
  const formattedDate = dueDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const subject = `RFQ ${rfqNo} – Request for Quotation${projectName ? ` | ${projectName}` : ""}`;

  const body = `
Dear ${companyName || "Valued Vendor"},

TransSeas is pleased to invite your company to submit a quotation for the following Request for Quotation (RFQ):

RFQ Number: ${rfqNo}
Project: ${projectName || "N/A"}
Submission Deadline: ${formattedDate}

Please review the RFQ details in the portal and submit your best pricing, delivery timeline, and terms.

If you require any clarification, feel free to contact our procurement team.

Kind regards,  
TransSeas Procurement Team
`;

  return { subject, body };
};

export const generateRFQNumber = async (tx: any) => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Find last RFQ of this month
  const lastRFQ = await tx.rFQ.findFirst({
    where: {
      createdAt: {
        gte: new Date(year, now.getMonth(), 1),
        lt: new Date(year, now.getMonth() + 1, 1),
      },
    },
    orderBy: { createdAt: "desc" },
    select: { rfqNo: true },
  });

  let sequence = 1;

  if (lastRFQ?.rfqNo) {
    const lastSeq = Number(lastRFQ.rfqNo.split("-")[3]);
    sequence = lastSeq + 1;
  }

  const paddedSeq = String(sequence).padStart(3, "0");

  return `RFQ-${year}-${month}-${paddedSeq}`;
};

export const generateQuotationNumber = async (tx: any, prefix = "PTC") => {
  const year = new Date().getFullYear();

  const lastRecord = await tx.quotation.findFirst({
    where: {
      number: {
        startsWith: `${prefix}-Q-${year}-`,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      number: true,
    },
  });

  let sequence = 1;

  if (lastRecord?.number) {
    const lastSeq = Number(lastRecord.number.split("-")[3]);
    sequence = lastSeq + 1;
  }

  return `${prefix}-Q-${year}-${sequence}`;
};
