import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string; // ObjectId as string
  name: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role?: UserRole; // default handled by Prisma
  profileImage?: string | null;
  address?: string | null;
  country?: string | null;
  otp?: number | null;
  city?: string | null;
  isVerified?: boolean; // default in DB
  isActive?: boolean; // default in DB

  userStatus?: UserStatus; // default in DB

  companyName?: string | null;
  category?: string | null;
  website?: string | null;
}

export interface IUserUpdate {
  name?: string;
  email?: string;

  passwordHash?: string;

  phone?: string | null;

  profileImage?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;

  isVerified?: boolean;
  isActive?: boolean;

  userStatus?: UserStatus;

  companyName?: string | null;
  category?: string | null;
  website?: string | null;
  role?: UserRole;
}
