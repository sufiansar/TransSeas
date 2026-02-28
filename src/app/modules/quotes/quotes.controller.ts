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

const getAllQuotations = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const user = req.user;
    const quotations = await QuotationService.getAllQuotations(query, user);
    console.log("User in controller:", user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Quotations retrieved successfully",
      data: quotations,
    });
  },
);

const updateQuotationStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { quotationId, status } = req.body;
    const user = req.user;
    const updatedQuotation = await QuotationService.quotationStatusUpdate(
      quotationId,
      status,
      user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Quotation status updated successfully",
      data: updatedQuotation,
    });
  },
);

const deleteQuotation = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { quotationId } = req.params;
    const user = req.user;
    await QuotationService.deleteQuotation(quotationId as string, user);
    sendResponse(res, {
      statusCode: HttpStatus.NO_CONTENT,
      success: true,
      message: "Quotation deleted successfully",
      data: null,
    });
  },
);
export const QuotesController = {
  createQuotation,
  getAllQuotations,
  updateQuotationStatus,
  deleteQuotation,
};
