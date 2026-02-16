import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const createRFQSchema = z.object({
  projectId: objectId,

  vendors: z.array(objectId).min(1, "At least one vendor is required"),

  items: z.array(objectId).min(1, "At least one item is required"),
  terms: z
    .string()
    .min(10, "Terms should be at least 10 characters")
    .optional(),

  dueDate: z.coerce.date().refine((d) => d > new Date(), {
    message: "Due date must be a future date",
  }),

  emailSubject: z.string().min(5, "Email subject too short").optional(),

  emailMessage: z
    .string()
    .min(20, "Email message should be meaningful")
    .optional(),

  followUpEmail: z.string().min(15, "Follow-up email too short").optional(),
});

export const updateRFQSchema = z.object({
  projectId: objectId.optional(),

  vendors: z
    .array(objectId)
    .min(1, "At least one vendor is required")
    .optional(),

  items: z.array(objectId).min(1, "At least one item is required").optional(),

  dueDate: z.coerce
    .date()
    .refine((d) => d > new Date(), {
      message: "Due date must be a future date",
    })
    .optional(),

  emailSubject: z.string().min(5, "Email subject too short").optional(),

  emailMessage: z
    .string()
    .min(20, "Email message should be meaningful")
    .optional(),

  followUpEmail: z.string().min(15, "Follow-up email too short").optional(),
});
