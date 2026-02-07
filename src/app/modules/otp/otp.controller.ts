
import { Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status-codes";
import { OtpService } from "./otp.service";


const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { name, email } = req.body;

   await OtpService.sendOtp(name, email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Otp sent successfully",
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await OtpService.verifyOtp(email, otp);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});
;

export const OtpController = {
  sendOtp,
  verifyOtp,
};
