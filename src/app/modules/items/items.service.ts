import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ItemsFilterableFields, ItemsSearchableFields } from "./items.constant";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const PROCUREMENT_ITEMS_API_URL =
  process.env.PROCUREMENT_ITEMS_API_URL ||
  "http://206.162.244.134:8073/api/items/";
const PROCUREMENT_ADMIN_API_URL =
  process.env.PROCUREMENT_ADMIN_API_URL ||
  "http://206.162.244.134:8073/api/admin/";

// const normalizeBaseUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

// const uploadPdfAndExcelFiles = async (
//   excelFile?: Express.Multer.File,
//   pdfFile?: Express.Multer.File,
//   project_id?: string,
// ) => {
//   if (!excelFile && !pdfFile) {
//     throw new AppError(
//       HttpStatus.BAD_REQUEST,
//       "At least one file is required: excel_file or pdf_file",
//     );
//   }

//   const normalizedProjectId = String(project_id ?? "").trim();

//   if (!normalizedProjectId) {
//     throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
//   }

//   const formData = new FormData();

//   if (excelFile) {
//     formData.append("excel_file", excelFile.buffer, {
//       filename: excelFile.originalname,
//       contentType: excelFile.mimetype,
//     });
//   }

//   if (pdfFile) {
//     formData.append("pdf_file", pdfFile.buffer, {
//       filename: pdfFile.originalname,
//       contentType: pdfFile.mimetype,
//     });
//   }

//   formData.append("project_id", normalizedProjectId);

//   const uploadApiUrl =
//     process.env.PROCUREMENT_UPLOAD_API_URL ||
//     "http://206.162.244.134:8073/api/upload/";

//   try {
//     const response = await axios.post(uploadApiUrl, formData, {
//       headers: formData.getHeaders(),
//       maxBodyLength: Infinity,
//       maxContentLength: Infinity,
//     });

//     return response.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       const externalMessage =
//         (error.response?.data as { detail?: string })?.detail ||
//         error.response?.statusText ||
//         error.message;

//       throw new AppError(
//         HttpStatus.BAD_GATEWAY,
//         `Upload service failed: ${externalMessage}`,
//       );
//     }

//     throw new AppError(HttpStatus.BAD_GATEWAY, "Upload service failed");
//   }
// };

// const getUploadBatchItems = async (batchId: string, project_id: string) => {
//   if (!batchId) {
//     throw new AppError(HttpStatus.BAD_REQUEST, "Batch ID is required");
//   }

//   // if (!project_id) {
//   //   throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
//   // }

//   const uploadApiBaseUrl =
//     process.env.PROCUREMENT_UPLOAD_API_URL ||
//     "http://206.162.244.134:8073/api/upload/";

//   const normalizedBaseUrl = uploadApiBaseUrl.endsWith("/")
//     ? uploadApiBaseUrl
//     : `${uploadApiBaseUrl}/`;

//   // Add project_id as query param
//   const batchUrl = `${normalizedBaseUrl}batch/${encodeURIComponent(batchId)}?project_id=${encodeURIComponent(project_id)}`;

//   try {
//     const response = await axios.get(batchUrl, {
//       headers: {
//         accept: "application/json",
//       },
//     });

//     return response.data;
//   } catch (error) {
//     if (axios.isAxiosError(error)) {
//       const externalMessage =
//         (error.response?.data as { detail?: string; message?: string })
//           ?.detail ||
//         (error.response?.data as { detail?: string; message?: string })
//           ?.message ||
//         error.response?.statusText ||
//         error.message;

//       throw new AppError(
//         HttpStatus.BAD_GATEWAY,
//         `Upload batch fetch failed: ${externalMessage}`,
//       );
//     }

//     throw new AppError(HttpStatus.BAD_GATEWAY, "Upload batch fetch failed");
//   }
// };

const normalizeBaseUrl = (url: string) => (url.endsWith("/") ? url : `${url}/`);

const isValidObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value);

const appendMulterFileToForm = (
  formData: FormData,
  key: "excel_file" | "pdf_file",
  file?: Express.Multer.File,
) => {
  if (!file) return;

  // memoryStorage
  if (file.buffer && file.buffer.length > 0) {
    formData.append(key, file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return;
  }

  // diskStorage
  const fileWithPath = file as Express.Multer.File & { path?: string };
  if (fileWithPath.path) {
    formData.append(key, fs.createReadStream(fileWithPath.path), {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    return;
  }

  throw new AppError(HttpStatus.BAD_REQUEST, `${key} is invalid or empty`);
};

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
  if (!isValidObjectId(normalizedProjectId)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid project_id format");
  }

  const formData = new FormData();
  appendMulterFileToForm(formData, "excel_file", excelFile);
  appendMulterFileToForm(formData, "pdf_file", pdfFile);
  formData.append("project_id", normalizedProjectId);

  const uploadApiUrl =
    process.env.PROCUREMENT_UPLOAD_API_URL ||
    "http://206.162.244.134:8073/api/upload/";

  try {
    const response = await axios.post(uploadApiUrl, formData, {
      headers: formData.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      timeout: 120000,
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
        `Upload service failed: ${externalMessage}`,
      );
    }

    throw new AppError(HttpStatus.BAD_GATEWAY, "Upload service failed");
  }
};

const getUploadBatchItems = async (batchId: string, project_id: string) => {
  const normalizedBatchId = String(batchId ?? "").trim();
  const normalizedProjectId = String(project_id ?? "").trim();

  if (!normalizedBatchId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Batch ID is required");
  }
  if (!normalizedProjectId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Project ID is required");
  }
  if (!isValidObjectId(normalizedProjectId)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid project_id format");
  }

  const uploadApiBaseUrl =
    process.env.PROCUREMENT_UPLOAD_API_URL ||
    "http://206.162.244.134:8073/api/upload/";
  const normalizedBaseUrl = normalizeBaseUrl(uploadApiBaseUrl);

  const batchUrl = `${normalizedBaseUrl}batch/${encodeURIComponent(normalizedBatchId)}?project_id=${encodeURIComponent(normalizedProjectId)}`;

  let externalData: any;

  // Fetch from external service
  try {
    const response = await axios.get(batchUrl, {
      headers: { accept: "application/json" },
      timeout: 120000,
    });
    externalData = response.data;
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

  //  Save to local DB
  try {
    const items: any[] = Array.isArray(externalData?.items)
      ? externalData.items
      : [];
    if (!items.length) return externalData;

    // ensure project exists in local DB
    const project = await prisma.project.findUnique({
      where: { id: normalizedProjectId },
      select: { id: true },
    });

    if (!project) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "project_id not found in local DB",
      );
    }

    // dedupe by external _id to avoid duplicate insert failures
    const candidateIds = items
      .map((i) => String(i?._id ?? "").trim())
      .filter((id) => isValidObjectId(id));

    const existing = candidateIds.length
      ? await prisma.items.findMany({
          where: { id: { in: candidateIds } },
          select: { id: true },
        })
      : [];

    const existingIdSet = new Set(existing.map((x) => x.id));

    const rows = items
      .map((i) => {
        const externalId = String(i?._id ?? "").trim();
        if (!isValidObjectId(externalId)) return null;
        if (existingIdSet.has(externalId)) return null;

        return {
          id: externalId,
          item_name: i?.item_name ?? null,
          item_code: String(i?.item_code ?? "").trim(),
          manufacturer: i?.manufacturer ?? null,
          description: i?.description ?? null,
          batch_id: i?.batch_id ?? normalizedBatchId,
          qty: i?.qty != null ? String(i.qty) : null,
          status: i?.status ?? null,
          project_id: normalizedProjectId,
          commodity: i?.commodity ?? null,
        };
      })
      .filter(
        (x): x is NonNullable<typeof x> => Boolean(x) && Boolean(x?.item_code),
      );

    if (rows.length) {
      await prisma.items.createMany({ data: rows });
    }

    return externalData;
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      HttpStatus.BAD_GATEWAY,
      `Local DB save failed: ${error?.message || "Unknown error"}`,
    );
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

const itemUpdates = async (id: string, payload: any, user: JwtPayload) => {
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

  if (!existingItem) {
    throw new AppError(HttpStatus.NOT_FOUND, "Item not found");
  }

  const updatedItem = await prisma.items.update({
    where: { id },
    data: payload,
  });

  return updatedItem;
};
export const ItemsService = {
  uploadPdfAndExcelFiles,
  getUploadBatchItems,
  getAllItems,
  getItemById,
  deleteItems,
  getItemStatsSummary,
  getNeedsReviewItems,
  itemUpdates,
};
