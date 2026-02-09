export interface IRFQ {
  projectId: string;
  vendors: string[];
  items: string[];
  dueDate: Date;
  emailSubject?: string;
  emailMessage?: string;
  followUpEmail?: string;
}
