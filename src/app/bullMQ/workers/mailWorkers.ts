import { Worker, Job } from "bullmq";
import { redisOptions } from "../../config/radis.config";
import { sendEmail } from "../../utility/sendEmail";
import { OTP_EXPIRATION } from "../../helper/generateOtp";
import { prisma } from "../../config/prisma";
import { generateRFQPdf } from "../../utility/generateRFQPdf";
import { generateRFQExcel } from "../../utility/generateRFQExcel";
import fs from "fs/promises";
import { existsSync } from "fs";
import fsPromises from "fs/promises";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { rfqEmailTemplate } from "../../utility/templates/rfqEmailTemplate";
import { inviteEmailTemplate } from "../../utility/templates/inviteEmailTemplate";
import { resetPasswordEmailTemplate } from "../../utility/templates/resetPasswordEmailTemplate";
import { otpEmailTemplate } from "../../utility/templates/otpEmailTemplate";
import { getFollowUpEmail } from "../../utility/templates/followUpEmail";

/* -----------------------------
   Job payload types
----------------------------- */

type MailJobData =
  | { email: string; otp: string } // verifyParentOtp
  | { email: string } // resendParentOtp, resendTwoFactorOTP
  | { email: string; token: string } // requestPasswordReset
  | { email: string; name: string; resetUILink: string } // forgotPassword
  | {
      email: string;
      referenceNo: string;
      companyName: string;
      rfqNo: string;
      emailSubject: string;
      emailBody: string;
      terms: string;
      itemIds: string[];
    } // sendRFQ
  | { email: string; inviteLink: string; role: string };

/* -----------------------------
   Worker
----------------------------- */

export const mailWorker = new Worker(
  "mail-queue",
  async (job: Job<MailJobData>) => {
    switch (job.name) {
      // case "verifyParentOtp":
      //   await sendOtpEmail(job.data as { email: string; otp: string });
      //   break;

      // case "resendParentOtp":
      //   await resendOtpEmail(job.data as { email: string });
      //   break;

      case "sendRFQ":
        await handleRFQEmail(
          job.data as {
            email: string;
            companyName: string;
            rfqNo: string;
            referenceNo: string;
            emailSubject: string;
            emailBody: string;
            terms: string;
            itemIds: string[];
          },
        );
        break;

      // case "requestPasswordReset":
      //   await sendResetEmail(job.data as { email: string; token: string });
      //   break;
      // case "forgotPassword":
      //   await handleForgotPassword(
      //     job.data as {
      //       email: string;
      //       name: string;
      //       resetUILink: string;
      //     },
      //   );
      //   break;
      // case "sendInviteUser":
      //   await handleInviteUserEmail(
      //     job.data as {
      //       email: string;
      //       inviteLink: string;
      //       role: string;
      //     },
      //   );
      //   break;

      // case "resendTwoFactorOTP":
      //   await resendOtpEmail(job.data as { email: string });
      //   break;

      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
  },
  {
    connection: redisOptions,
    concurrency: 5,
  },
);

/* -----------------------------
   Email handlers
----------------------------- */

export async function handleForgotPassword(data: {
  email: string;
  name: string;
  resetUILink: string;
}) {
  // Generate HTML from the TS template
  const htmlContent = resetPasswordEmailTemplate({
    name: data.name,
    resetUILink: data.resetUILink,
  });

  // Send email directly
  await sendEmail({
    to: data.email,
    subject: "Reset Your Password",
    html: htmlContent,
  });
}

export async function handleInviteUserEmail(data: {
  email: string;
  inviteLink: string;
  role?: string;
}) {
  const htmlContent = inviteEmailTemplate({
    inviteLink: data.inviteLink,
  });

  await sendEmail({
    to: data.email,
    subject: "You're invited to join TransSeas",
    html: htmlContent,
  });
}
export async function sendOtpEmail({
  email,
  name,
  otp,
}: {
  email: string;
  name?: string;
  otp: string;
}) {
  const expiryMinutes = Math.floor(OTP_EXPIRATION / 60);

  // Generate HTML from TS template
  const htmlContent = otpEmailTemplate({
    name: name || "there",
    otp,
    expiry: expiryMinutes,
  });

  // Send email directly
  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    html: htmlContent,
  });
}

// async function resendOtpEmail({ email }: { email: string }) {
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   await sendEmail({
//     to: email,
//     subject: "Your OTP Code",
//     templateName: "otp",
//     templateData: { otp },
//   });
// }

// async function sendResetEmail({
//   email,
//   token,
// }: {
//   email: string;
//   token: string;
// }) {
//   await sendEmail({
//     to: email,
//     subject: "Reset Your Password",
//     templateName: "reset-password",
//     templateData: { token },
//   });
// }

export async function handleFollowUpEmail({
  email,
  vendorName,
  projectRef,
  rfqNo,
}: {
  email: string;
  vendorName: string;
  projectRef: string;
  rfqNo: string;
}) {
  //  Generate HTML content from your template
  const htmlContent = getFollowUpEmail(vendorName, projectRef, rfqNo);

  // 2️⃣ Send the email directly
  await sendEmail({
    to: email,
    subject: `Follow-up: RFQ ${rfqNo} – Request for Quotation`,
    html: htmlContent,
  });

  return { message: `Follow-up email sent to ${vendorName}` };
}
// export async function handleRFQEmail(data: {
//   email: string;
//   companyName: string;
//   rfqNo: string;
//   referenceNo: string;
//   emailSubject: string;
//   emailBody: string;
//   itemIds: string[];
// }) {
//   // 1. Fetch RFQ items
//   const items = await prisma.items.findMany({
//     where: {
//       id: { in: data.itemIds },
//     },
//   });

//   const project = await prisma.project.findUnique({
//     where: {
//       referenceNo: data.referenceNo,
//     },
//   });

//   if (!project) {
//     throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
//   }

//   // 2. Generate PDF & Excel
//   const pdfPath = await generateRFQPdf(items, data.rfqNo, data.referenceNo);
//   const excelPath = await generateRFQExcel(items, data.rfqNo, data.referenceNo);

//   // 3. Read files into buffers
//   const pdfBuffer = await fs.readFile(pdfPath);
//   const excelBuffer = await fs.readFile(excelPath);

//   // 4. Send email with attachments
//   await sendEmail({
//     to: data.email,
//     subject: data.emailSubject,
//     templateName: "rfq",
//     templateData: {
//       companyName: data.companyName,
//       rfqNo: data.rfqNo,
//       emailSubject: data.emailSubject,
//       emailBody: data.emailBody,
//     },
//     attachments: [
//       {
//         filename: `RFQ-${data.rfqNo}.pdf`,
//         content: pdfBuffer,
//         contentType: "application/pdf",
//       },
//       {
//         filename: `RFQ-${data.rfqNo}.xlsx`,
//         content: excelBuffer,
//         contentType:
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//       },
//     ],
//   });

//   // 5. Cleanup temp files safely ✅
//   try {
//     await fsPromises.access(pdfPath);
//     await fsPromises.unlink(pdfPath);
//   } catch {
//     // file does not exist, skip
//   }

//   try {
//     await fsPromises.access(excelPath);
//     await fsPromises.unlink(excelPath);
//   } catch {
//     // file does not exist, skip
//   }
// }

export async function handleRFQEmail(data: {
  email: string;
  companyName: string;
  rfqNo: string;
  referenceNo: string;
  emailSubject: string;
  emailBody: string;
  itemIds: string[];
}) {
  // 1️⃣ Fetch RFQ items
  const items = await prisma.items.findMany({
    where: { id: { in: data.itemIds } },
  });

  // 2️⃣ Fetch project
  const project = await prisma.project.findUnique({
    where: { referenceNo: data.referenceNo },
  });

  if (!project) {
    throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
  }

  // 3️⃣ Generate PDF & Excel
  const pdfPath = await generateRFQPdf(items, data.rfqNo, data.referenceNo);
  const excelPath = await generateRFQExcel(items, data.rfqNo, data.referenceNo);

  // 4️⃣ Read files into buffers
  const pdfBuffer = await fs.readFile(pdfPath);
  const excelBuffer = await fs.readFile(excelPath);

  // 5️⃣ Generate email HTML using TS template
  const htmlContent = rfqEmailTemplate({
    emailSubject: data.emailSubject,
    emailBody: data.emailBody,
    companyName: data.companyName,
    rfqNo: data.rfqNo,
  });

  // 6️⃣ Send email with attachments
  await sendEmail({
    to: data.email,
    subject: data.emailSubject,
    html: htmlContent,
    attachments: [
      {
        filename: `RFQ-${data.rfqNo}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
      {
        filename: `RFQ-${data.rfqNo}.xlsx`,
        content: excelBuffer,
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ],
  });

  // 7️⃣ Cleanup temp files safely
  for (const filePath of [pdfPath, excelPath]) {
    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
    } catch {
      // file does not exist, skip
    }
  }
}
/* -----------------------------
   Logs
----------------------------- */
mailWorker.on("completed", (job) => {
  console.log(`✅ Mail job completed: ${job.name}`);
});

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Mail job failed: ${job?.name}`, err.message);
});
