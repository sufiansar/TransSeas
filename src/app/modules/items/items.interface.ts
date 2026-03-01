import { Unit } from "@prisma/client";

export enum ItemStatus {
  PARSED = "Parsed",
  NEEDS_REVIEW = "Needs Review",
  LOCKED = "Locked",
  APPROVED = "Approved",
}

export interface Item {
  id: string;
  item_name?: string;
  item_code: string;
  manufacturer?: string;
  description?: string;
  qty?: string;
  unit: Unit;
  price?: number;
  remarks?: string;
  status?: ItemStatus;
  rfqId?: string;
  batch_id?: string;
  rfq?: any;
  project_id: string;
  project?: any;
  quatationsItems?: any[];
  commodityId: string;
  commodity?: any;
  createdAt?: Date;
  updatedAt?: Date;
}
