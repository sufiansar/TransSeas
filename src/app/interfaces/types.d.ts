import multer from "multer";

declare module "multer" {
  interface File {
    location?: string; // S3 URL
    key?: string; // S3 key if you need it
  }
}
