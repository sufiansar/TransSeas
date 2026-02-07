import { ItemsStatus, Unit } from "@prisma/client";
import z from "zod";

export const CreateItemsSchema = z
  .object({
    itemTitle: z.string().min(1, "Item title is required").optional(),

    quantity: z
      .number({ message: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than 0"),

    menufacturer: z
      .string()
      .min(1, "Manufacturer name cannot be empty")
      .optional(),

    itemcode: z.string().min(1, "Item code is required"),

    specifications: z
      .string()
      .min(1, "Specifications cannot be empty")
      .optional(),

    price: z
      .number({ message: "Price must be a number" })
      .nonnegative("Price cannot be negative")
      .optional(),

    unit: z
      .nativeEnum(Unit, {
        message: "Invalid unit value",
      })
      .optional(),

    status: z
      .nativeEnum(ItemsStatus, {
        message: "Invalid item status",
      })
      .optional(),

    rfqId: z.string().optional().nullable(),

    projectId: z.string().min(1, "Project ID is required"),
  })
  .strict();

export const UpdateItemsSchema = z
  .object({
    itemTitle: z.string().min(1, "Item title cannot be empty").optional(),

    quantity: z
      .number({ message: "Quantity must be a number" })
      .int("Quantity must be an integer")
      .positive("Quantity must be greater than 0")
      .optional(),

    menufacturer: z
      .string()
      .min(1, "Manufacturer name cannot be empty")
      .optional(),

    itemcode: z.string().min(1, "Item code cannot be empty").optional(),

    specifications: z
      .string()
      .min(1, "Specifications cannot be empty")
      .optional(),

    price: z
      .number({ message: "Price must be a number" })
      .nonnegative("Price cannot be negative")
      .optional(),

    unit: z
      .nativeEnum(Unit, {
        message: "Invalid unit value",
      })
      .optional(),

    status: z
      .nativeEnum(ItemsStatus, {
        message: "Invalid item status",
      })
      .optional(),

    rfqId: z.string().nullable().optional(),

    projectId: z.string().min(1, "Project ID is required").optional(),
  })
  .strict();
