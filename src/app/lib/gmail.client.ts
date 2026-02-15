import { google } from "googleapis";
// import { default as pdfParse } from "pdf-parse/lib/pdf-parse";
import XLSX from "xlsx";
import { prisma } from "../config/prisma";
const pdfParse = require("pdf-parse");
import fs from "fs";
import path from "path";
import { uploadBufferToS3 } from "../config/s3Bucket";
import { uploadBufferToCloudinary } from "../config/clodinary.config";

/* ======================
   GMAIL AUTH
====================== */

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

/* ======================
   GMAIL WATCH
====================== */

export async function startGmailWatch() {
  await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName: "projects/transseas/topics/rfq-email-topic",
      labelIds: ["INBOX"],
    },
  });
}

export async function fetchNewEmails(historyId: string) {
  const res = await gmail.users.history.list({
    userId: "me",
    startHistoryId: historyId,
  });

  const messages =
    res.data.history?.flatMap((h) => h.messagesAdded?.map((m) => m.message)) ||
    [];

  for (const msg of messages) {
    if (msg?.id) await processMessage(msg.id);
  }
}

/* ======================
   MESSAGE HANDLER
====================== */
function isReply(headers: any[]) {
  return headers.some(
    (h) => h.name === "In-Reply-To" || h.name === "References",
  );
}

async function processMessage(messageId: string) {
  const message = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = message.data.payload?.headers || [];

  // ✅ only replies
  if (!isReply(headers)) return;

  const subject = headers.find((h) => h.name === "Subject")?.value || "";

  // ✅ only RFQ emails
  const rfqNumber = extractQuotationNumber(subject);
  if (!rfqNumber) return;

  // ✅ must contain attachment
  const attachments = await getAttachments(messageId);
  if (!attachments.length) return;

  for (const file of attachments) {
    if (!file.filename.match(/\.(pdf|xls|xlsx)$/i)) continue;

    await parseAndSave(file.buffer, file.filename, rfqNumber);
  }
}

export function extractQuotationNumber(subject = "") {
  return subject.match(/RFQ-\d{4}-\d{2}-\d+/)?.[0];
}

/* ======================
   ATTACHMENT SAFE LOADER
====================== */

async function getAttachments(messageId: string) {
  const message = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const parts: any[] = [];

  function walk(p: any) {
    if (p.filename && p.body?.attachmentId) parts.push(p);
    if (p.parts) p.parts.forEach(walk);
  }

  walk(message.data.payload);

  const files = [];

  for (const part of parts) {
    const att = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: part.body.attachmentId,
    });

    const base64 = att.data.data!.replace(/-/g, "+").replace(/_/g, "/");

    files.push({
      filename: part.filename,
      buffer: Buffer.from(base64, "base64"),
    });
  }

  return files;
}

/* ======================
   COLUMN NORMALIZATION
====================== */

const COLUMN_MAP: Record<string, string> = {
  "item title": "itemTitle",
  item: "itemTitle",
  "item code": "itemCode",
  code: "itemCode",
  manufacturer: "manufacturer",
  menufacturer: "manufacturer",
  qty: "quantity",
  quantity: "quantity",
  unit: "unit",
  price: "price",
  rate: "price",
  specifications: "specifications",
  spec: "specifications",
  status: "status",
  total: "total",
};

function normalizeRow(row: any) {
  const clean: any = {};

  for (const key in row) {
    const k = key.toLowerCase().trim();
    if (COLUMN_MAP[k]) clean[COLUMN_MAP[k]] = row[key];
  }

  clean.quantity = Number(clean.quantity || 0);
  clean.price = Number(clean.price || 0);
  clean.total = Number((clean.quantity * clean.price).toFixed(2));

  return clean;
}

async function saveFile(
  buffer: Buffer,
  quotationNumber: string,
  filename: string,
) {
  const dir = path.join("uploads", "quotations", quotationNumber);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, filename);

  await fs.promises.writeFile(filePath, buffer);

  return filePath;
}

/* ======================
   PARSERS
====================== */

function parseExcel(buffer: Buffer) {
  const wb = XLSX.read(buffer);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  return rows.map(normalizeRow).filter((r) => r.itemTitle);
}

function parsePdfText(text: string) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items: any[] = [];

  for (const line of lines) {
    const parts = line.split(/\s{2,}/);

    if (parts.length < 4) continue;

    const [itemTitle, qty, unit, price] = parts;

    items.push({
      itemTitle,
      quantity: Number(qty),
      unit,
      price: Number(price),
      total: Number(qty) * Number(price),
    });
  }
  return items;
}

/* ======================
   MAIN PARSER
====================== */

export async function parseAndSave(
  buffer: Buffer,
  filename: string,
  quotationNumber: string,
) {
  const lower = filename.toLowerCase();

  /* ======================
     UPLOAD TO CLOUD
  ====================== */

  // 👉 S3 (recommended)
  // const uploaded = await uploadBufferToS3(
  //   buffer,
  //   filename,
  //   `quotations/${quotationNumber}`,
  // );

  // const storedPath = uploaded.url; // cloud URL
  // const storedKey = uploaded.key; // keep if you want delete later

  // 👉 OR Cloudinary (if you prefer)

  const uploaded = await uploadBufferToCloudinary(buffer, filename);
  const storedPath = uploaded?.secure_url || "";

  /* ======================
     PARSE FILE
  ====================== */

  let items: any[] = [];
  if (lower.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    items = parsePdfText(data.text);
  }

  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    items = parseExcel(buffer);
  }

  /* ======================
     SAVE IN DB
  ====================== */

  await prisma.quotation.upsert({
    where: { number: quotationNumber },
    update: {
      sourceFile: storedPath,
    },
    create: {
      number: quotationNumber,
      fileType: lower.endsWith(".pdf") ? "PDF" : "EXCEL",
      sourceFile: storedPath,
      items: {
        create: items,
      },
    },
  });
}

/* ======================
   VALIDATION
====================== */

function validateItems(items: any[]) {
  if (!items.length) throw new Error("No quotation items found");

  for (const i of items) {
    if (!i.itemTitle) throw new Error("Missing item title");
    if (i.quantity <= 0) throw new Error("Invalid quantity");
    if (i.price <= 0) throw new Error("Invalid price");

    const calc = Number((i.quantity * i.price).toFixed(2));
    if (Math.abs(calc - i.total) > 0.01)
      throw new Error("Total calculation mismatch");
  }
}
