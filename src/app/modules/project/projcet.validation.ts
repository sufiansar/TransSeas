import { Currency, ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const CreateProjectSchema = z.object({
  id: z.string().optional(),

  name: z.string().min(1, "Project name is required"),

  referenceNo: z.string().min(1, "Reference number is required"),

  status: z.nativeEnum(ProjectStatus, {
    message: "Invalid project status",
  }),
  vendorId: z.string().min(1, "Vendor ID is required"), // ✅ THIS
  isActive: z.boolean().refine((v) => typeof v === "boolean", {
    message: "Project active status is required",
  }),

  priceLevel: z
    .number({ message: "Price level must be a number" })
    .nonnegative("Price level cannot be negative")
    .optional()
    .default(0),

  categoryId: z.string().nullable().optional(),

  currency: z
    .nativeEnum(Currency, { message: "Invalid currency value" })
    .optional()
    .default("USD"),

  country: z.string().min(1, "Country is required"),

  location: z.string().min(1, "Location is required"),
});

export const UpdateProjectSchema = z
  .object({
    id: z.string().optional(),

    name: z.string().min(1, "Project name is required").optional(),

    referenceNo: z.string().min(1, "Reference number is required").optional(),

    status: z
      .nativeEnum(ProjectStatus, {
        message: "Invalid project status",
      })
      .optional(),

    vendorId: z.string().min(1, "Vendor ID is required").optional(),

    isActive: z
      .boolean({
        message: "Project active status is required",
      })
      .optional(),

    priceLevel: z
      .number({ message: "Price level must be a number" })
      .nonnegative("Price level cannot be negative")
      .optional(),

    categoryId: z.string().nullable().optional(),

    currency: z
      .nativeEnum(Currency, { message: "Invalid currency value" })
      .optional(),

    country: z.string().min(1, "Country is required").optional(),

    location: z.string().min(1, "Location is required").optional(),
  })
  .strict();
