import { Currency, ProjectStatus } from "@prisma/client";

export interface IProject {
  id?: string;

  projectName: string;
  referenceNo: string;

  clientEmail?: string;
  clientName?: string;

  status?: ProjectStatus;
  isActive?: boolean;
  commoditiId?: string | null;

  totalPrice?: number | null;
  categoryId?: string | null;

  currency?: Currency;

  country: string;
  location: string;

  createdAt?: Date;
  updatedAt?: Date;
}
