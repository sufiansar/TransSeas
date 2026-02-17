// Vendor Create On User Module

import { UserRole } from "@prisma/client";
import { Request, Response } from "express";
import { prisma } from "../../config/prisma";
import { catchAsync } from "../../utility/catchAsync";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status";
import { VendorService } from "./vendor.service";
const addVendor = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const user = req.user;
  const result = await VendorService.addVendor(userData, user);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Vendor created successfully",
    data: result,
  });
});

const updateVendor = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.params.id;
  const updateData = req.body;
  const user = req.user;
  const result = await VendorService.updateVendor(
    vendorId as string,
    updateData,
    user,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendor updated successfully",
    data: result,
  });
});

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

const deleteVendor = catchAsync(async (req: Request, res: Response) => {
  const vendorId = req.params.id;
  const user = req.user;
  const result = await VendorService.deleteVendor(vendorId as string, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vendor deleted successfully",
    data: result,
  });
});

export const VendorController = {
  getAllVendors,
  getVendorById,
  addVendor,
  updateVendor,
  deleteVendor,
};
