import z from "zod";

export const createCommoditySchema = z.object({
  name: z
    .string()
    .min(2, "Commodity name must be at least 2 characters long")
    .max(100, "Commodity name cannot exceed 100 characters"),
});

export const updateCommoditySchema = z.object({
  name: z
    .string()
    .min(2, "Commodity name must be at least 2 characters long")
    .max(100, "Commodity name cannot exceed 100 characters")
    .optional(),
});
