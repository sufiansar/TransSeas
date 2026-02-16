import { ItemsStatus, Unit } from "@prisma/client";

export interface CreateItemDTO {
  itemTitle?: string;
  quantity: number;
  manufacturer?: string;
  itemcode: string;
  specifications?: string;
  price?: number;
  unit?: Unit;
  status?: ItemsStatus;
  rfqId?: string | null;
  projectId: string;
  commonditiId?: string | null;
}
