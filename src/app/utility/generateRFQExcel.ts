import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";

export const generateRFQExcel = async (items: any[], rfqNo: string) => {
  const tmpDir = path.join(process.cwd(), "tmp");

  await fs.mkdir(tmpDir, { recursive: true });

  const filePath = path.join(tmpDir, `${rfqNo}.xlsx`);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("RFQ Items");

  sheet.columns = [
    { header: "Item Title", key: "itemTitle", width: 30 },
    { header: "Item Code", key: "itemcode", width: 18 },
    { header: "Manufacturer", key: "menufacturer", width: 22 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Unit", key: "unit", width: 10 },
    { header: "Price", key: "price", width: 14 },
    { header: "Specifications", key: "specifications", width: 35 },
    { header: "Status", key: "status", width: 14 },
  ];

  items.forEach((item) => sheet.addRow(item));

  await workbook.xlsx.writeFile(filePath);

  return filePath;
};
