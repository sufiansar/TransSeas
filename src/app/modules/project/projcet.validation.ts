import { Currency, ProjectStatus } from "@prisma/client";
import { z } from "zod";

export const CreateProjectSchema = z.object({
  id: z.string().optional(),

  name: z.string().min(1, "Project name is required"),

  // referenceNo: z.string().min(1, "Reference number is required"),

  commodity: z.string().optional().nullable(),

  clientName: z.string().optional().nullable(),

  clientEmail: z.string().email("Invalid email address").optional(),
  status: z
    .nativeEnum(ProjectStatus, {
      message: "Invalid project status",
    })
    .optional(),
  commoditiId: z.string().optional().nullable(),

  isActive: z.boolean().optional().default(true),

  totalPrice: z
    .number({ message: "Total price must be a number" })
    .nonnegative("Total price cannot be negative")
    .optional(),

  categoryId: z.string().nullable().optional(),

  currency: z
    .nativeEnum(Currency, { message: "Invalid currency value" })
    .optional()
    .default(Currency.USD),

  country: z.string().min(1, "Country is required"),

  location: z.string().min(1, "Location is required"),
});

export const UpdateProjectSchema = z
  .object({
    id: z.string().optional(),

    name: z.string().min(1, "Project name is required").optional(),

    referenceNo: z.string().min(1, "Reference number is required").optional(),

    commodity: z.string().optional().nullable(),

    commoditiId: z.string().optional().nullable(),

    status: z
      .nativeEnum(ProjectStatus, {
        message: "Invalid project status",
      })
      .optional(),

    isActive: z.boolean().optional(),

    totalPrice: z
      .number({ message: "Total price must be a number" })
      .nonnegative("Total price cannot be negative")
      .optional(),

    categoryId: z.string().nullable().optional(),

    currency: z
      .nativeEnum(Currency, { message: "Invalid currency value" })
      .optional(),

    country: z.string().min(1, "Country is required").optional(),

    location: z.string().min(1, "Location is required").optional(),
  })
  .strict();

export const generateProjectNumber = async (tx: any) => {
  const year = new Date().getFullYear();

  const lastProject = await tx.project.findFirst({
    where: {
      referenceNo: {
        startsWith: `PRJ-P-${year}-`,
      },
    },
    orderBy: {
      referenceNo: "desc",
    },
    select: {
      referenceNo: true,
    },
  });

  let sequence = 1;

  if (lastProject?.referenceNo) {
    const lastSeq = Number(lastProject.referenceNo.split("-").pop());
    sequence = lastSeq + 1;
  }
  console.log("LAST PROJECT:", lastProject?.referenceNo);

  return `PRJ-P-${year}-${sequence}`;
};
