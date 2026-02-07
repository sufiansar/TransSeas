import { Queue } from "bullmq";
import { redisOptions } from "../../config/radis.config";

/**
 * One queue for all email related background jobs
 * (OTP, auth, password reset, notifications)
 */

/**
 * All email background jobs live here
 */
export const mailQueue = new Queue("mail-queue", {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
  },
});



// --------------------
// Helper functions (optional but clean)
// --------------------
export const addForgotPasswordJob = (
  email: string,
  name: string,
  resetUILink: string
) => {
  return mailQueue.add("forgotPassword", {
    email,
    name,
    resetUILink,
  });
};

export const addVerifyParentOtpJob = (email: string, otp: string) =>
  mailQueue.add("verifyParentOtp", { email, otp });

export const addResendParentOtpJob = (email: string) =>
  mailQueue.add("resendParentOtp", { email });

export const addRequestPasswordResetJob = (email: string, token: string) =>
  mailQueue.add("requestPasswordReset", { email, token });

export const addResetPasswordJob = (userId: string) =>
  mailQueue.add("resetPassword", { userId });

export const addUpdateTwoFactorJob = (userId: string, enabled: boolean) =>
  mailQueue.add("updateTwoFactorAuthentication", { userId, enabled });

export const addResendTwoFactorOtpJob = (email: string) =>
  mailQueue.add("resendTwoFactorOTP", { email });


const DAY = 24 * 60 * 60 * 1000;

export const scheduleFollowUps = async (userId: string, email: string) => {
  await mailQueue.add(
    "followUpEmail",
    { userId, email, step: 1 },
    { delay: 2 * DAY, jobId: `followup1:${userId}` }
  );

  await mailQueue.add(
    "followUpEmail",
    { userId, email, step: 2 },
    { delay: 5 * DAY, jobId: `followup2:${userId}` }
  );

  await mailQueue.add(
    "followUpEmail",
    { userId, email, step: 3 },
    { delay: 10 * DAY, jobId: `followup3:${userId}` }
  );
};
