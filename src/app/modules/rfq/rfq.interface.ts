import { rfqStatus } from "@prisma/client";

export interface IRFQ {
  projectId: string;
  vendors: string[];
  items: string[];
  dueDate: Date;
  rfqStatus?: rfqStatus;
  emailSubject?: string;
  emailMessage?: string;
  followUpEmail?: string;
}
type RFQEmailPayload = {
  rfqNo: string;
  projectName: string;
  dueDate: Date;
  email: string[];
};
