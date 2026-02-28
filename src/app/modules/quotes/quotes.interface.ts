import { FileType } from "@prisma/client";

export interface CreateQuotationDto {
  [x: string]: any;
  number: string;
  vendorId?: string | null;
  subject?: string | null;
  rfqId: string;
  sourceFile?: string;
  fileType?: FileType;
  projectId: string;
  validUntil?: Date;
  totalAmount?: number;
  deliveryTerms?: string;
  paymentTerms?: string;
}
