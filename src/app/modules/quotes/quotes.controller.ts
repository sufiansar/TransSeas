import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { QuotationService } from "./quotes.service";
import { sendResponse } from "../../utility/sendResponse";
import HttpStatus from "http-status";

const createQuotation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result = await QuotationService.createQuotation(payload);
    sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Quotation created successfully",
      data: result,
    });
  },
);

export const QuotesController = {
  createQuotation,
};
