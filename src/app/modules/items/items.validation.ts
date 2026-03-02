import { Unit } from "@prisma/client";
import { z } from "zod";
import { ItemStatus } from "./items.interface";

export const CreateItemsSchema = z
  .object({
    item_name: z.string().min(1, "Item name is required").optional(),

    item_code: z.string().min(1, "Item code is required"),

    manufacturer: z
      .string()
      .min(1, "Manufacturer name cannot be empty")
      .optional(),

    description: z.string().min(1, "Description cannot be empty").optional(),

    qty: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: "Quantity must be a valid number",
      }),

    unit: z
      .nativeEnum(Unit, {
        message: "Invalid unit value",
      })
      .optional(),

    price: z
      .number({ message: "Price must be a number" })
      .nonnegative("Price cannot be negative")
      .optional(),

    remarks: z.string().optional(),

    status: z
      .nativeEnum(ItemStatus, { message: "Invalid item status" })
      .optional(),

    rfqId: z.string().optional().nullable(),

    project_id: z.string().min(1, "Project ID is required"),
  })
  .strict();

export const UpdateItemsSchema = z
  .object({
    item_name: z.string().min(1, "Item name cannot be empty").optional(),

    item_code: z.string().min(1, "Item code cannot be empty").optional(),

    manufacturer: z
      .string()
      .min(1, "Manufacturer name cannot be empty")
      .optional(),

    description: z.string().min(1, "Description cannot be empty").optional(),

    qty: z
      .string()
      .optional()
      .refine((val) => !val || /^\d+$/.test(val), {
        message: "Quantity must be a valid number",
      }),

    unit: z.nativeEnum(Unit, { message: "Invalid unit value" }).optional(),

    price: z
      .number({ message: "Price must be a number" })
      .nonnegative("Price cannot be negative")
      .optional(),

    remarks: z.string().optional(),

    status: z
      .nativeEnum(ItemStatus, { message: "Invalid item status" })
      .optional(),

    rfqId: z.string().nullable().optional(),

    project_id: z.string().min(1, "Project ID is required").optional(),

    commodityId: z.string().min(1, "Commodity ID is required").optional(),
  })
  .strict();

export const UploadItemsSchema = z
  .object({
    project_id: z.string().trim().min(1, "Project ID is required"),
  })
  .strict();
