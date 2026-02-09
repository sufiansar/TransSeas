import PDFDocument from "pdfkit";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export const generateRFQPdf = async (items: any[], rfqNo: string) => {
  const tmpDir = path.join(process.cwd(), "tmp");

  await fsPromises.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${rfqNo}.pdf`);

  const doc = new PDFDocument({ margin: 40 });
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  doc.fontSize(18).text(`RFQ Items – ${rfqNo}`, { align: "center" });
  doc.moveDown();

  items.forEach((item, i) => {
    doc.fontSize(12).text(
      `${i + 1}. ${item.itemTitle}
Code: ${item.itemcode}
Manufacturer: ${item.menufacturer}
Quantity: ${item.quantity} ${item.unit}
Unit Price: ${item.price}
Specifications: ${item.specifications}
Status: ${item.status}`,
      { lineGap: 3 },
    );

    doc.moveDown(0.5);
  });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return filePath;
};
