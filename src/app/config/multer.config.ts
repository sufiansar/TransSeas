// uploadMiddleware.ts
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import dbConfig from "./db.config";
import { s3 } from "./s3Bucket";

// Allowed MIME types
const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

// Multer S3 storage config
const storage = multerS3({
  s3,
  bucket: dbConfig.aws.bucket_name as string,
  acl: "public-read",
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}-${cleanName}${ext}`;

    // 📂 Determine folder based on MIME type
    let folder = "others";
    switch (file.mimetype) {
      case "application/pdf":
        folder = "pdf";
        break;
      case "application/vnd.ms-excel":
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        folder = "excel";
        break;
      default:
        if (file.mimetype.startsWith("image/")) folder = "images";
        break;
    }

    cb(null, `${folder}/${uniqueName}`);
  },
});

export const multerUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      (req as any).fileValidationError =
        "Invalid file type. Only PDF, Excel, and Image files are allowed.";
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});
