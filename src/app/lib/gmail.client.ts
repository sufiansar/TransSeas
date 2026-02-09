import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
);

// load saved refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

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
    await processMessage(msg?.id!);
  }
}

async function processMessage(messageId: string) {
  const message = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  const subject = message.data.payload?.headers?.find(
    (h) => h.name === "Subject",
  )?.value;

  const quotationNumber = extractQuotationNumber(subject);

  const parts = message.data.payload?.parts || [];

  for (const part of parts) {
    if (!part.filename) continue;

    const attachment = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: part.body!.attachmentId!,
    });

    const buffer = Buffer.from(attachment.data.data!, "base64");

    await parseAndSave(buffer, part.filename, quotationNumber);
  }
}

function extractQuotationNumber(subject = "") {
  const match = subject.match(/PTC-Q-\d{4}-\d+/);
  return match?.[0];
}

import pdf from "pdf-parse";
import XLSX from "xlsx";
import { prisma } from "../config/prisma";

async function parseAndSave(
  buffer: Buffer,
  filename: string,
  quotationNumber: string,
) {
  let items: any[] = [];

  if (filename.endsWith(".pdf")) {
    const data = await pdf(buffer);
    items = parseTextRows(data.text);
  }

  if (filename.endsWith(".xlsx")) {
    const wb = XLSX.read(buffer);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    items = XLSX.utils.sheet_to_json(sheet);
  }

  await saveQuotation(quotationNumber, items);
}
function parseTextRows(text: string) {
  return text
    .split("\n")
    .map((l) => l.split(","))
    .filter((r) => r.length >= 3)
    .map(([name, qty, price]) => ({
      name,
      quantity: Number(qty),
      price: Number(price),
    }));
}

async function saveQuotation(number: string, items: any[]) {
  await prisma.quotation.create({
    data: {
      number,
      items: {
        create: items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
      },
    },
  });
}
