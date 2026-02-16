export const generateQuotationNumber = async (tx: any) => {
  const now = new Date();

  const year = now.getFullYear();

  // Find last quotation of this year
  const lastQuotation = await tx.quotation.findFirst({
    where: {
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  });

  let sequence = 1;

  if (lastQuotation?.number) {
    const lastSeq = Number(lastQuotation.number.split("-")[3]);
    sequence = lastSeq + 1;
  }

  // You can pad if you want fixed length (optional)
  // const paddedSeq = String(sequence).padStart(3, "0");

  return `PTC-Q-${year}-${sequence}`;
};
