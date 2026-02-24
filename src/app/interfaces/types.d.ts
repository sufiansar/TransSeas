import multer from "multer";

declare module "multer" {
  interface File {
    location?: string; 
    key?: string; 
  }
}
