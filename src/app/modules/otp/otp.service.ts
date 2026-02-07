import AppError from "../../errorHelpers/AppError";
import { redisClient } from "../../config/radis.config";
import { prisma } from "../../config/prisma";
import { generateOtp, OTP_EXPIRATION } from "../../helper/generateOtp";
import { addVerifyParentOtpJob } from "../../bullMQ/queues/mailQueues";


const sendOtp = async (name: string, email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new AppError(404, "User not found");
  if (user.isVerified) throw new AppError(401, "You are already verified");

  const otp = generateOtp();
  const redisKey = `otp:${email}`;

  // ✅ Save OTP in Redis (same as before)
  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });

  const expiryMinutes = Math.floor(OTP_EXPIRATION / 60);

  // ✅ Send email via BullMQ (background)
  await addVerifyParentOtpJob(email, otp);

  // (optional return if frontend needs it)
  return {
    email,
    expiryMinutes,
  };
};

const verifyOtp = async (email: string, otp: string) => {
  const savedOtp = await redisClient.get(`otp:${email}`);

  if (!savedOtp) throw new AppError(400, "Expired OTP");
  if (savedOtp !== otp) throw new AppError(400, "Invalid OTP");

  const updatedUser = await prisma.user.update({
    where: { email: email.trim().toLowerCase() },
    data: { isVerified: true },
  });

  console.log("UPDATED USER:", updatedUser);

  await redisClient.del(`otp:${email}`);

  return updatedUser;
};



export const OtpService = {
  sendOtp,
  verifyOtp,
};
