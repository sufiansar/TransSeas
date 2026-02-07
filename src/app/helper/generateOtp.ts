import crypto from "crypto";
export const OTP_EXPIRATION = 2 * 60;

export const generateOtp = (length = 6) => {
  return crypto.randomInt(10 ** (length - 1), 10 ** length).toString();
};