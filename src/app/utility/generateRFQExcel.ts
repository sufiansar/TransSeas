// import ExcelJS from "exceljs";
// import path from "path";
// import fs from "fs/promises";

// export const generateRFQExcel = async (
//   items: any[],
//   rfqNo: string,
//   referenceNo: string,
// ) => {
//   const tmpDir = path.join(process.cwd(), "tmp");

//   await fs.mkdir(tmpDir, { recursive: true });

//   const filePath = path.join(tmpDir, `${rfqNo}.xlsx`);

//   const workbook = new ExcelJS.Workbook();
//   const sheet = workbook.addWorksheet("RFQ Items");

//   sheet.columns = [
//     { header: "Item Title", key: "itemTitle", width: 30 },
//     { header: "Item Code", key: "itemcode", width: 18 },
//     { header: "Manufacturer", key: "menufacturer", width: 22 },
//     { header: "Quantity", key: "quantity", width: 12 },
//     { header: "Unit", key: "unit", width: 10 },
//     { header: "Price", key: "price", width: 14 },
//     { header: "Specifications", key: "specifications", width: 35 },
//     { header: "Status", key: "status", width: 14 },
//   ];

//   items.forEach((item) => sheet.addRow(item));

//   await workbook.xlsx.writeFile(filePath);

//   return filePath;
// };
import ExcelJS from "exceljs";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

export const generateRFQExcel = async (
  items: any[],
  rfqNo: string,
  referenceNo: string,
) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  await fsPromises.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${rfqNo}.xlsx`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("RFQ");

  // ===== LOGO =====
  const logoPath = path.join(process.cwd(), "src/assets/logo.png");
  if (fs.existsSync(logoPath)) {
    const imageId = workbook.addImage({
      filename: logoPath,
      extension: "png",
    });
    // Add image at top-left (columns 1-3, rows 1-4)
    sheet.addImage(imageId, "A1:D5");
  }

  // ===== RFQ INFO =====
  sheet.mergeCells("D1", "H2");
  sheet.getCell("D1").value = "REQUEST FOR QUOTATION";
  sheet.getCell("D1").font = { size: 18, bold: true };
  sheet.getCell("D1").alignment = { vertical: "middle", horizontal: "center" };

  sheet.mergeCells("D3", "H3");
  sheet.getCell("D3").value = `RFQ No: ${rfqNo}`;
  sheet.getCell("D3").alignment = { horizontal: "center" };

  sheet.mergeCells("D4", "H4");
  sheet.getCell("D4").value = `Project REF No: ${referenceNo}`;
  sheet.getCell("D4").alignment = { horizontal: "center" };

  // ===== HEADERS =====
  const headers = [
    "Item Title",
    "Item Code",
    "Manufacturer",
    "Qty",
    "Unit",
    // "Price",
    // "Specifications",
    // "Status",
  ];

  sheet.addRow([]);
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center" };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ===== DATA =====
  items.forEach((item) => {
    const row = sheet.addRow([
      item.itemTitle,
      item.itemcode,
      item.manufacturer,
      item.quantity,
      item.unit,
      // item.price ?? "N/A",
      // item.specifications,
      // item.status,
    ]);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // ===== COLUMN WIDTHS =====
  const colWidths = [30, 20, 25, 10, 10, 25]; // adjust as needed
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // ===== FOOTER =====
  const lastRow = sheet.addRow([]);
  const footerRow = sheet.addRow(["System generated RFQ document."]);
  sheet.mergeCells(`A${footerRow.number}:F${footerRow.number}`);
  footerRow.getCell(1).alignment = { horizontal: "center" };
  footerRow.font = { italic: true, size: 10 };

  // ===== SAVE FILE =====
  await workbook.xlsx.writeFile(filePath);

  return filePath;
};
