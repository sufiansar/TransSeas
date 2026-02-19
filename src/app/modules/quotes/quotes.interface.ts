import { FileType } from "@prisma/client";

export interface CreateQuotationDto {
  number: string;
  vendorId?: string | null;
  subject?: string | null;
  sourceFile?: string;
  fileType?: FileType;
  projectId: string;
}
