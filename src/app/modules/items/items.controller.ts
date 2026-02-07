import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { ItemsService } from "./items.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status-codes";

const createItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result = await ItemsService.createItem(payload);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Item created successfully",
      data: result,
    });
  },
);

const getAllItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const user = req.user;
    const items = await ItemsService.getAllItems(query, user);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Items retrieved successfully",
      data: items,
    });
  },
);

const getItemById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const item = await ItemsService.getItemById(id as string);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Item retrieved successfully",

      data: item,
    });
  },
);

const updateItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;
    const item = await ItemsService.updateItems(id as string, payload, user);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  },
);

const deleteItem = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const user = req.user;
    const item = await ItemsService.deleteItems(id as string, user);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Item deleted successfully",
      data: item,
    });
  },
);
export const ItemsController = {
  createItem,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
