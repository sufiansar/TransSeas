import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";

export const generateRFQExcel = async (
  items: any[],
  rfqNo: string,
  referenceNo: string,
) => {
  const tmpDir = path.join(process.cwd(), "tmp");
  await fs.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${rfqNo}.xlsx`);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("RFQ");

  // ===== TITLE =====
  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = "REQUEST FOR QUOTATION";
  sheet.getCell("A1").font = { size: 20, bold: true };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A2:G2");
  sheet.getCell("A2").value = `RFQ No: ${rfqNo}`;
  sheet.getCell("A2").alignment = { horizontal: "center" };

  sheet.mergeCells("A3:G3");
  sheet.getCell("A3").value = `Project REF No: ${referenceNo}`;
  sheet.getCell("A3").alignment = { horizontal: "center" };

  sheet.addRow([]);

  // ===== HEADERS =====
  const headers = [
    "Item Name",
    "Item Code",
    "Manufacturer",
    "Commodity",
    "Qty",
    "Unit",
    "Description",
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 12 };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 25;

  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ===== COLUMN WIDTHS (wider description) =====
  const colWidths = [30, 20, 25, 25, 12, 12, 80]; // Description column very wide
  colWidths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // ===== DATA =====
  items.forEach((item) => {
    const row = sheet.addRow([
      item.item_name,
      item.item_code,
      item.manufacturer,
      item.commodity,
      item.qty,
      item.unit,
      item.description || "N/A",
    ]);

    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
      cell.font = { size: 11 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Auto-fit row height based on description text
    const desc = item.description || "";
    const approxLineCount = Math.ceil(desc.length / 50); // 50 chars per line approx
    row.height = approxLineCount * 18; // 18 pts per line
  });

  // ===== FOOTER =====
  sheet.addRow([]);
  const footerRow = sheet.addRow(["System generated RFQ document."]);
  sheet.mergeCells(`A${footerRow.number}:G${footerRow.number}`);
  footerRow.getCell(1).alignment = { horizontal: "center" };
  footerRow.font = { italic: true, size: 11 };

  // ===== SAVE =====
  await workbook.xlsx.writeFile(filePath);

  return filePath;
};
