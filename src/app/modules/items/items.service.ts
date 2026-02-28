import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import AppError from "../../errorHelpers/AppError";

import HttpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ItemsFilterableFields, ItemsSearchableFields } from "./items.constant";
import axios from "axios";
import FormData from "form-data";

const uploadPdfAndExcelFiles = async (
  excelFile?: Express.Multer.File,
  pdfFile?: Express.Multer.File,
  projectId?: string,
) => {
  if (!excelFile && !pdfFile) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "At least one file is required: excel_file or pdf_file",
    );
  }

  if (!projectId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
  }

  const formData = new FormData();

  if (excelFile) {
    formData.append("excel_file", excelFile.buffer, {
      filename: excelFile.originalname,
      contentType: excelFile.mimetype,
    });
  }

  if (pdfFile) {
    formData.append("pdf_file", pdfFile.buffer, {
      filename: pdfFile.originalname,
      contentType: pdfFile.mimetype,
    });
  }

  formData.append("projectId", projectId);

  const uploadApiUrl =
    process.env.PROCUREMENT_UPLOAD_API_URL ||
    "http://206.162.244.134:8073/api/upload/";

  try {
    const response = await axios.post(uploadApiUrl, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const externalMessage =
        (error.response?.data as { detail?: string })?.detail ||
        error.response?.statusText ||
        error.message;

      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        `Upload service failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Upload service failed");
  }
};

const getUploadBatchItems = async (batchId: string, projectId: string) => {
  if (!batchId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Batch ID is required");
  }

  // if (!projectId) {
  //   throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
  // }

  const uploadApiBaseUrl =
    process.env.PROCUREMENT_UPLOAD_API_URL ||
    "http://206.162.244.134:8073/api/upload/";

  const normalizedBaseUrl = uploadApiBaseUrl.endsWith("/")
    ? uploadApiBaseUrl
    : `${uploadApiBaseUrl}/`;

  // Add projectId as query param
  const batchUrl = `${normalizedBaseUrl}batch/${encodeURIComponent(batchId)}?projectId=${encodeURIComponent(projectId)}`;

  try {
    const response = await axios.get(batchUrl, {
      headers: {
        accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const externalMessage =
        (error.response?.data as { detail?: string; message?: string })
          ?.detail ||
        (error.response?.data as { detail?: string; message?: string })
          ?.message ||
        error.response?.statusText ||
        error.message;

      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        `Upload batch fetch failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Upload batch fetch failed");
  }
};

const getAllItems = async (query: Record<string, any>, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can access items",
    );
  }

  if (query.batch_id) {
    const procurementItemsApiUrl =
      process.env.PROCUREMENT_ITEMS_API_URL ||
      "http://206.162.244.134:8073/api/items/";

    try {
      const response = await axios.get(procurementItemsApiUrl, {
        headers: {
          accept: "application/json",
        },
        params: {
          status: query.status,
          batch_id: query.batch_id,
          page: query.page,
          limit: query.limit,
        },
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const externalMessage =
          (error.response?.data as { detail?: string; message?: string })
            ?.detail ||
          (error.response?.data as { detail?: string; message?: string })
            ?.message ||
          error.response?.statusText ||
          error.message;

        throw new AppError(
          HttpStatus.BAD_GATEWAY,
          `Procurement items fetch failed: ${externalMessage}`,
        );
      }

      throw new AppError(
        HttpStatus.BAD_GATEWAY,
        "Procurement items fetch failed",
      );
    }
  }

  const queryBuilder = new PrismaQueryBuilder(query);

  const builtQuery = queryBuilder
    .filter(ItemsFilterableFields)
    .search(ItemsSearchableFields)
    .fields()
    .sort()
    .paginate()
    .build();

  const [data, meta] = await Promise.all([
    prisma.items.findMany({
      ...builtQuery,
      include: {
        commodity: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
    queryBuilder.getMeta(prisma.items),
  ]);

  return {
    data,
    meta,
  };
};

export const getItemById = async (id: string) => {
  const item = await prisma.items.findUnique({
    where: { id },
  });
  if (!item) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }
  return item;
};

const updateItems = async (id: string, payload: any, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }
  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can update items",
    );
  }

  const existingItem = await prisma.items.findUnique({
    where: { id },
  });
  if (!existingItem) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }

  const updatedItem = await prisma.items.update({
    where: { id },
    data: payload,
  });
  return updatedItem;
};

const deleteItems = async (id: string, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can delete items",
    );
  }

  const existingItem = await prisma.items.findUnique({
    where: { id },
  });

  if (!existingItem) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }

  await prisma.items.delete({
    where: { id },
  });

  return existingItem;
};
export const ItemsService = {
  uploadPdfAndExcelFiles,
  getUploadBatchItems,
  getAllItems,
  getItemById,
  updateItems,
  deleteItems,
};
