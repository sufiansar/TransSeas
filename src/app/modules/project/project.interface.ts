import { Currency, ProjectStatus } from "@prisma/client";

export interface IProject {
  id?: string;

  name: string;
  referenceNo: string;

  vendorId?: string | null;
  vendorName?: string | null;

  status?: ProjectStatus;
  isActive?: boolean;

  priceLevel?: number | null;
  categoryId?: string | null;

  currency?: Currency;

  country: string;
  location: string;

  createdAt?: Date;
  updatedAt?: Date;
}
