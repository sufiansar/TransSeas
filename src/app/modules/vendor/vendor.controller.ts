// Vendor Create On User Module

import { UserRole } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status";
import { VendorService } from "./vendor.service";

const getAllVendors = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await VendorService.getAllVendors(query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendors retrieved successfully",
    data: result,
  });
});

const getVendorById = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.params.id;
  const result = await VendorService.getVendorById(vendorId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendor retrieved successfully",
    data: result,
  });
});

export const VendorController = {
  getAllVendors,
  getVendorById,
};
