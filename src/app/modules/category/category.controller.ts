import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { CategoryService } from "./category.service";
import { sendResponse } from "../../utility/sendResponse";
import HttpStatus from "http-status";

const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = req.body;
    const result = await CategoryService.createCategory(req.user, payload);
    sendResponse(res, {
      statusCode: HttpStatus.CREATED,
      success: true,

      message: "Category created successfully",
      data: result,
    });
  },
);

const getAllCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const result = await CategoryService.getAllCategories(req.user, query);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Categories retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  },
);
const getCategoryById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const result = await CategoryService.getCategoryById(
      req.user,
      categoryId as string,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Category retrieved successfully",
      data: result,
    });
  },
);

const updateCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const payload = req.body;
    const result = await CategoryService.updateCategory(
      req.user,
      categoryId as string,
      payload,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Category updated successfully",
      data: result,
    });
  },
);

const deleteCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const result = await CategoryService.deleteCategory(
      req.user,
      categoryId as string,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Category deleted successfully",
      data: result,
    });
  },
);

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
