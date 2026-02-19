import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { CommodityService } from "./commodity.service";
import { sendResponse } from "../../utility/sendResponse";
import HttpStatus from "http-status";

const createCommodity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result = await CommodityService.createCommodity(payload, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,
      message: "Commodity created successfully",
      data: result,
    });
  },
);

const getAllCommodities = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await CommodityService.getAllCommodities(query, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,

      message: "Commodities retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);

const getVendorsByCommonditiId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commodityId } = req.params;
    const user = req.user,
      result = await CommodityService.getVendorsByCommonditiId(
        commodityId as string,
        user,
      );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Vendors retrieved successfully",
      data: result,
    });
  },
);

const getItemsByCommonditiId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commodityId } = req.params;
    const user = req.user;
    const result = await CommodityService.getItemsByCommonditiId(
      commodityId as string,
      user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Items retrieved successfully",
      data: result,
    });
  },
);

const getCommodityById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commodityId } = req.params;
    const result = await CommodityService.getCommodityById(
      commodityId as string,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Commodity retrieved successfully",
      data: result,
    });
  },
);

const updateCommodity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commodityId } = req.params;
    const payload = req.body;
    const result = await CommodityService.updateCommodity(
      commodityId as string,
      payload,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Commodity updated successfully",
      data: result,
    });
  },
);

const deleteCommodity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { commodityId } = req.params;
    const result = await CommodityService.deleteCommodity(
      commodityId as string,

      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,

      success: true,
      message: "Commodity deleted successfully",
      data: result,
    });
  },
);

export const CommodityController = {
  createCommodity,
  getAllCommodities,
  getCommodityById,
  getVendorsByCommonditiId,
  getItemsByCommonditiId,
  updateCommodity,
  deleteCommodity,
};
