import { Worker, Job } from "bullmq";
import { redisOptions } from "../../config/radis.config";
import { sendEmail } from "../../utility/sendEmail";
import { OTP_EXPIRATION } from "../../helper/generateOtp";

/* -----------------------------
   Job payload types
----------------------------- */

type MailJobData =
  | { email: string; otp: string }        // verifyParentOtp
  | { email: string }                     // resendParentOtp, resendTwoFactorOTP
  | { email: string; token: string };     // requestPasswordReset


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

      case "requestPasswordReset":
        await sendResetEmail(job.data as { email: string; token: string });
        break;
        case "forgotPassword":
  await handleForgotPassword(job.data as {
    email: string;
    name: string;
    resetUILink: string;
  });
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
  }
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
      name: name || "there",   // fallback safety
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

async function sendResetEmail({ email, token }: { email: string; token: string }) {
  await sendEmail({
    to: email,
    subject: "Reset Your Password",
    templateName: "reset-password",
    templateData: { token },
  });
}




export async function handleFollowUpEmail(data: { email: string; step: number }) {
  await sendEmail({
    to: data.email,
    subject: `Reminder ${data.step}`,
    templateName: "follow-up",
    templateData: {
      step: data.step,
    },
  });
}

/* -----------------------------
   Logs
----------------------------- */

mailWorker.on("completed", job => {
  console.log(`✅ Mail job completed: ${job.name}`);
});

mailWorker.on("failed", (job, err) => {
  console.error(`❌ Mail job failed: ${job?.name}`, err.message);
});
