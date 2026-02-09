// async function processMessage(messageId: string) {
//   const message = await gmail.users.messages.get({
//     userId: "me",
//     id: messageId,
//   });

//   const subject = message.data.payload?.headers?.find(
//     (h) => h.name === "Subject",
//   )?.value;

//   const quotationNumber = extractQuotationNumber(subject);

//   const parts = message.data.payload?.parts || [];

//   for (const part of parts) {
//     if (!part.filename) continue;

//     const attachment = await gmail.users.messages.attachments.get({
//       userId: "me",
//       messageId,
//       id: part.body!.attachmentId!,
//     });

//     const buffer = Buffer.from(attachment.data.data!, "base64");

//     await parseAndSave(buffer, part.filename, quotationNumber);
//   }
// }
