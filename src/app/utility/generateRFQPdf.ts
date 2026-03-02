import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export const generateRFQPdf = async (
  items: any[],
  rfqNo: string,
  referenceNo: string,
) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  await fsPromises.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${rfqNo}.pdf`);

  const doc = new PDFDocument({ margin: 30, size: "A4" });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  /* ===== LOGO ===== */
  const logoPath = path.join(process.cwd(), "src/assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 30, 25, { width: 100 });
  }

  doc
    .fontSize(18)
    .text("REQUEST FOR QUOTATION", 0, 40, { align: "center" })
    .fontSize(12)
    .text(`RFQ No: ${rfqNo}`, { align: "center" })
    .text(`Project REF No: ${referenceNo}`, { align: "center" });

  /*more breathing room after logo */
  doc.moveDown(4);

  /* ===== TABLE CONFIG (A4 FULL WIDTH) ===== */
  const startX = 30;
  // Total available width: 535
  const colWidths = [
    70, // item_name
    60, // Item Code
    65, // Manufacturer
    70, // Commodity
    30, // Qty
    40, // Unit
    200, // Description (wider now)
    0, // placeholder if needed
  ];

  const headers = [
    "Item Name",
    "Item Code",
    "Manufacturer",
    "Commodity",
    "Qty",
    "Unit",
    "Description",
  ];
  const drawRow = (y: number, row: string[], bold = false) => {
    let x = startX;

    const heights = row.map((text, i) =>
      doc.heightOfString(text || "", { width: colWidths[i] - 8 }),
    );

    const rowHeight = Math.max(...heights) + 12;

    row.forEach((cell, i) => {
      const w = colWidths[i];

      doc
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(9)
        .text(cell || "", x + 4, y + 6, { width: w - 8 });

      doc.rect(x, y, w, rowHeight).stroke();
      x += w;
    });

    return rowHeight;
  };

  let y = doc.y;

  /* ===== HEADER ===== */
  y += drawRow(y, headers, true);

  /* ===== DATA ===== */
  for (const item of items) {
    if (y > 740) {
      doc.addPage();
      y = 40;
      y += drawRow(y, headers, true);
    }

    y += drawRow(y, [
      item.item_name,
      item.item_code,
      item.manufacturer,
      item.commodity,
      String(item.qty),
      item.unit,
      item.description || "N/A",
    ]);
  }

  doc.y = y + 15;

  doc.fontSize(9).text("System generated RFQ document.", { align: "center" });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return filePath;
};
