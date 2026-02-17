import { UserRole, UserStatus } from "@prisma/client";

export interface IUser {
  id?: string;
  name?: string | null;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role?: UserRole;
  profileImage?: string | null;
  address?: string | null;
  country?: string | null;
  otp?: number | null;
  city?: string | null;
  isVerified?: boolean;
  commoditiId?: string | null;
  commodities?: string[];
  additionalPhone?: string | null;
  isActive?: boolean;
  userStatus?: UserStatus;
  companyName?: string | null;
  designation?: string | null;
  categoryId?: string | null;
  website?: string | null;
}

export interface IUserUpdate {
  name?: string | null;
  email?: string;

  passwordHash?: string;

  phone?: string | null;
  additionalPhone?: string | null;
  designation?: string | null;
  profileImage?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;

  isVerified?: boolean;
  isActive?: boolean;
  commodities?: string[] | null;
  userStatus?: UserStatus;

  companyName?: string | null;
  categoryId?: string | null;
  website?: string | null;
  role?: UserRole;
}
