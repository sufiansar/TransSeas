import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import {
  previewRFQEmail as previewRFQEmailService,
  RFQService,
} from "./rfq.service";
import { sendResponse } from "../../utility/sendResponse";
import HttpStatus from "http-status";

export const createRFQ = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    console.log("Creating RFQ with data:", payload);
    const result = await RFQService.createRFQDto(payload);
    sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "RFQ created successfully",
      data: result,
    });
  },
);

const previewRFQEmail = async (req: Request, res: Response) => {
  const { projectId, dueDate, vendorIds } = req.query;

  console.log("Received query params:", { projectId, dueDate, vendorIds });

  // if (!projectId || !dueDate || !vendorIds) {
  //   return res.status(400).json({
  //     message: "projectId, dueDate and vendorIds are required",
  //   });
  // }

  const selectedVendorIds = (vendorIds as string).split(",");

  const preview = await RFQService.previewRFQEmail(
    projectId as string,
    new Date(dueDate as string),
    selectedVendorIds,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "RFQ email preview generated successfully",
    data: preview,
  });
};

const getAllRFQs = async (req: Request, res: Response) => {
  const query = req.query;
  const result = await RFQService.getAllRFQs(query);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "RFQs retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
};

const getRFQById = async (req: Request, res: Response) => {
  const { rfqId } = req.params;
  const result = await RFQService.getRFQById(rfqId as string);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "RFQ retrieved successfully",
    data: result,
  });
};

const updateRFQ = async (req: Request, res: Response) => {
  const { rfqId } = req.params;
  const payload = req.body;
  const result = await RFQService.updateRFQ(rfqId as string, payload);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "RFQ updated successfully",
    data: result,
  });
};

const deleteRFQ = async (req: Request, res: Response) => {
  const { rfqId } = req.params;
  const result = await RFQService.deleteRFQ(rfqId as string);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "RFQ deleted successfully",
    data: result,
  });
};

export const RFQController = {
  createRFQ,
  previewRFQEmail,
  getAllRFQs,
  getRFQById,
  updateRFQ,
  deleteRFQ,
};
