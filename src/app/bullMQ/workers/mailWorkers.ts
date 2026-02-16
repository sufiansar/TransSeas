import { Worker, Job } from "bullmq";
import { redisOptions } from "../../config/radis.config";
import { sendEmail } from "../../utility/sendEmail";
import { OTP_EXPIRATION } from "../../helper/generateOtp";
import { prisma } from "../../config/prisma";
import { generateRFQPdf } from "../../utility/generateRFQPdf";
import { generateRFQExcel } from "../../utility/generateRFQExcel";

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
      case "verifyParentOtp":
        await sendOtpEmail(job.data as { email: string; otp: string });
        break;

      case "resendParentOtp":
        await resendOtpEmail(job.data as { email: string });
        break;

      case "sendRFQ":
        await handleRFQEmail(
          job.data as {
            email: string;
            companyName: string;
            rfqNo: string;
            emailSubject: string;
            emailBody: string;
            terms: string;
            itemIds: string[];
          },
        );
        break;

      case "requestPasswordReset":
        await sendResetEmail(job.data as { email: string; token: string });
        break;
      case "forgotPassword":
        await handleForgotPassword(
          job.data as {
            email: string;
            name: string;
            resetUILink: string;
          },
        );
        break;
      case "sendInviteUser":
        await handleInviteUserEmail(
          job.data as {
            email: string;
            inviteLink: string;
            role: string;
          },
        );
        break;

      case "resendTwoFactorOTP":
        await resendOtpEmail(job.data as { email: string });
        break;

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

async function handleForgotPassword(data: {
  email: string;
  name: string;
  resetUILink: string;
}) {
  await sendEmail({
    to: data.email,
    subject: "Forget Password",
    templateName: "forgetPassword",
    templateData: {
      name: data.name,
      resetUILink: data.resetUILink,
    },
  });
}

async function handleInviteUserEmail(data: {
  email: string;
  inviteLink: string;
  role: string;
}) {
  await sendEmail({
    to: data.email,
    subject: "You're invited to join TransSeas",
    templateName: "invite-user",
    templateData: {
      inviteLink: data.inviteLink,
      role: data.role,
    },
  });
}

async function sendOtpEmail({
  email,
  name,
  otp,
}: {
  email: string;
  name?: string;
  otp: string;
}) {
  const expiryMinutes = Math.floor(OTP_EXPIRATION / 60);

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: {
      name: name || "there", // fallback safety
      otp,
      expiry: expiryMinutes,
    },
  });
}

async function resendOtpEmail({ email }: { email: string }) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  await sendEmail({
    to: email,
    subject: "Your OTP Code",
    templateName: "otp",
    templateData: { otp },
  });
}

async function sendResetEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  await sendEmail({
    to: email,
    subject: "Reset Your Password",
    templateName: "reset-password",
    templateData: { token },
  });
}

export async function handleFollowUpEmail(data: {
  email: string;
  step: number;
}) {
  await sendEmail({
    to: data.email,
    subject: `Reminder ${data.step}`,
    templateName: "follow-up",
    templateData: {
      step: data.step,
    },
  });
}

import fs from "fs/promises";

export async function handleRFQEmail(data: {
  email: string;
  companyName: string;
  rfqNo: string;
  emailSubject: string;
  emailBody: string;
  itemIds: string[];
}) {
  // 1. Fetch RFQ items
  const items = await prisma.items.findMany({
    where: {
      id: { in: data.itemIds },
    },
  });

  // 2. Generate PDF & Excel
  const pdfPath = await generateRFQPdf(items, data.rfqNo);
  const excelPath = await generateRFQExcel(items, data.rfqNo);

  // 3. Read files into buffers
  const pdfBuffer = await fs.readFile(pdfPath);
  const excelBuffer = await fs.readFile(excelPath);

  // 4. Send email with attachments
  await sendEmail({
    to: data.email,
    subject: data.emailSubject,
    templateName: "rfq",
    templateData: {
      companyName: data.companyName,
      rfqNo: data.rfqNo,
      emailSubject: data.emailSubject,
      emailBody: data.emailBody,
    },
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

  // 5. Cleanup temp files (important ✅)
  await fs.unlink(pdfPath);
  await fs.unlink(excelPath);
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
