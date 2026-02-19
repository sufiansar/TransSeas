import { ItemsStatus, Unit } from "@prisma/client";

export interface CreateItemDTO {
  itemTitle?: string;
  quantity: number;
  manufacturer?: string;
  itemcode: string;
  commodityId?: string;
  description?: string;
  price?: number;
  unit?: Unit;
  remarks?: string;
  status?: ItemsStatus;
  rfqId?: string | null;
  projectId: string;
}
