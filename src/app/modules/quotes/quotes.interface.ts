import { FileType } from "@prisma/client";

export interface CreateQuotationDto {
  number: string;
  vendorId?: string;
  subject?: string;
  sourceFile?: string;
  fileType?: FileType;
  projectId: string;
}
