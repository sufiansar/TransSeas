import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ItemsFilterableFields, ItemsSearchableFields } from "./items.constant";
import axios from "axios";
import FormData from "form-data";

const PROCUREMENT_ITEMS_API_URL =
  process.env.PROCUREMENT_ITEMS_API_URL ||
  "http://206.162.244.134:8073/api/items/";
const PROCUREMENT_ADMIN_API_URL =
  process.env.PROCUREMENT_ADMIN_API_URL ||
  "http://206.162.244.134:8073/api/admin/";

const normalizeBaseUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

const uploadPdfAndExcelFiles = async (
  excelFile?: Express.Multer.File,
  pdfFile?: Express.Multer.File,
  project_id?: string,
) => {
  if (!excelFile && !pdfFile) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "At least one file is required: excel_file or pdf_file",
    );
  }

  const normalizedProjectId = String(project_id ?? "").trim();

  if (!normalizedProjectId) {
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

  formData.append("project_id", normalizedProjectId);

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

const getUploadBatchItems = async (batchId: string, project_id: string) => {
  if (!batchId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Batch ID is required");
  }

  // if (!project_id) {
  //   throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
  // }

  const uploadApiBaseUrl =
    process.env.PROCUREMENT_UPLOAD_API_URL ||
    "http://206.162.244.134:8073/api/upload/";

  const normalizedBaseUrl = uploadApiBaseUrl.endsWith("/")
    ? uploadApiBaseUrl
    : `${uploadApiBaseUrl}/`;

  // Add project_id as query param
  const batchUrl = `${normalizedBaseUrl}batch/${encodeURIComponent(batchId)}?project_id=${encodeURIComponent(project_id)}`;

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

  if (
    query.batch_id ||
    query.status ||
    query.page ||
    query.limit ||
    query.external === "true"
  ) {
    const procurementItemsApiUrl = normalizeBaseUrl(PROCUREMENT_ITEMS_API_URL);

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

  if (item) {
    return item;
  }

  const itemUrl = `${normalizeBaseUrl(PROCUREMENT_ITEMS_API_URL)}${encodeURIComponent(id)}`;

  try {
    const response = await axios.get(itemUrl, {
      headers: {
        accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
    }

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
        `Procurement item fetch failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Procurement item fetch failed");
  }
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

  const existingItem = await prisma.items.findUnique({ where: { id } });

  if (existingItem) {
    const updatedItem = await prisma.items.update({
      where: { id },
      data: payload,
    });

    return updatedItem;
  }

  const itemUrl = `${normalizeBaseUrl(PROCUREMENT_ITEMS_API_URL)}${encodeURIComponent(id)}`;

  try {
    const response = await axios.patch(itemUrl, payload, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
    }

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
        `Procurement item update failed: ${externalMessage}`,
      );
    }

    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      "Procurement item update failed",
    );
  }
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

  const existingItem = await prisma.items.findUnique({ where: { id } });

  if (existingItem) {
    await prisma.items.delete({
      where: { id },
    });

    return existingItem;
  }

  const itemUrl = `${normalizeBaseUrl(PROCUREMENT_ITEMS_API_URL)}${encodeURIComponent(id)}`;

  try {
    const response = await axios.delete(itemUrl, {
      headers: {
        accept: "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
    }

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
        `Procurement item delete failed: ${externalMessage}`,
      );
    }

    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      "Procurement item delete failed",
    );
  }
};

const getItemStatsSummary = async (user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can access item stats",
    );
  }

  const statsUrl = `${normalizeBaseUrl(PROCUREMENT_ITEMS_API_URL)}stats/summary`;

  try {
    const response = await axios.get(statsUrl, {
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
        `Item stats fetch failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Item stats fetch failed");
  }
};

const updateItemStatus = async (
  id: string,
  payload: Record<string, any>,
  user: JwtPayload,
) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can update item status",
    );
  }

  const statusUrl = `${normalizeBaseUrl(PROCUREMENT_ADMIN_API_URL)}status/${encodeURIComponent(id)}`;

  try {
    const response = await axios.patch(statusUrl, payload, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
    }

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
        `Item status update failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Item status update failed");
  }
};

const bulkUpdateItemStatus = async (
  batchId: string,
  payload: Record<string, any>,
  user: JwtPayload,
) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can bulk update item status",
    );
  }

  if (!batchId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "batch_id is required");
  }

  const bulkStatusUrl = `${normalizeBaseUrl(PROCUREMENT_ADMIN_API_URL)}bulk-status`;

  try {
    const response = await axios.patch(bulkStatusUrl, payload, {
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      params: {
        batch_id: batchId,
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
        `Bulk item status update failed: ${externalMessage}`,
      );
    }

    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      "Bulk item status update failed",
    );
  }
};

const getNeedsReviewItems = async (user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can access needs-review items",
    );
  }

  const needsReviewUrl = `${normalizeBaseUrl(PROCUREMENT_ADMIN_API_URL)}needs-review`;

  try {
    const response = await axios.get(needsReviewUrl, {
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
        `Needs review fetch failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Needs review fetch failed");
  }
};
export const ItemsService = {
  uploadPdfAndExcelFiles,
  getUploadBatchItems,
  getAllItems,
  getItemById,
  updateItems,
  deleteItems,
  getItemStatsSummary,
  updateItemStatus,
  bulkUpdateItemStatus,
  getNeedsReviewItems,
};
