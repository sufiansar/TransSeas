import { z } from "zod";

import { UserRole, UserStatus } from "@prisma/client";

const UserRoleEnum = z
  .nativeEnum(UserRole)
  .refine((val) => Object.values(UserRole).includes(val), {
    message: "Invalid user role",
  });

const UserStatusEnum = z
  .nativeEnum(UserStatus)
  .refine((val) => Object.values(UserStatus).includes(val), {
    message: "Invalid user status",
  });

export const userUpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required").nullable().optional(),

    email: z.string().email("Invalid email address").optional(),

    passwordHash: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),

    phone: z.string().optional().nullable(),

    profileImage: z
      .string()
      .url("Profile image must be a valid URL")
      .optional()
      .nullable(),

    address: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
    city: z.string().optional().nullable(),

    isVerified: z
      .boolean()
      .catch(() => false)
      .optional(),

    isActive: z
      .boolean()
      .catch(() => false)
      .optional(),

    userStatus: UserStatusEnum.optional(),

    companyName: z.string().optional().nullable(),
    category: z.string().optional().nullable(),

    website: z
      .string()
      .url("Website must be a valid URL")
      .optional()
      .nullable(),

    role: UserRoleEnum.optional(),
  })
  .strict();

export const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required").nullable().optional(),

  email: z.string().email("Invalid email address"),

  passwordHash: z.string().min(6, "Password must be at least 6 characters"),

  phone: z.string().optional().nullable(),

  role: UserRoleEnum.optional(),
  commonditiId: z.string().optional().nullable(),
  profileImage: z
    .string()
    .url("Profile image must be a valid URL")
    .optional()
    .nullable(),

  address: z.string().optional().nullable(),

  country: z.string().optional().nullable(),

  city: z.string().optional().nullable(),

  companyName: z.string().optional().nullable(),

  category: z.string().optional().nullable(),

  website: z.string().url("Website must be a valid URL").optional().nullable(),
});
