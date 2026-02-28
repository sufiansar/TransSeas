import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { ItemsService } from "./items.service";
import { sendResponse } from "../../utility/sendResponse";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";

const uploadPdfAndExcelFiles = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const files = req.files as
      | {
          [fieldname: string]: Express.Multer.File[];
        }
      | undefined;

    const excelFile = files?.excel_file?.[0];
    const pdfFile = files?.pdf_file?.[0];

    const { projectId } = req.body;

    const result = await ItemsService.uploadPdfAndExcelFiles(
      excelFile,
      pdfFile,
      projectId,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Files uploaded and processed successfully",
      data: result,
    });
  },
);
const getUploadBatchItems = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { batchId } = req.params;
    const { projectId } = req.query;

    // if (!projectId || typeof projectId !== "string") {
    //   return next(
    //     new AppError(httpStatus.BAD_REQUEST, "Project ID is required"),
    //   );
    // }

    const result = await ItemsService.getUploadBatchItems(
      batchId as string,
      projectId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Batch items retrieved successfully",
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
  uploadPdfAndExcelFiles,
  getUploadBatchItems,
  getAllItems,
  getItemById,
  updateItem,
  deleteItem,
};
