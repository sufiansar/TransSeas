import multer from "multer";
import { uploadBufferToCloudinary } from "./clodinary.config";

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

const storage = multer.memoryStorage();

export const multerCloudinaryUpload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

/* 🔥 Adapter middleware — makes Cloudinary look like S3 */
export const cloudinaryMiddleware = async (req: any, res: any, next: any) => {
  try {
    // Single
    if (req.file) {
      const result = await uploadBufferToCloudinary(
        req.file.buffer,
        req.file.originalname,
      );

      req.file.path = result?.secure_url;
    }

    // Multiple
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        const result = await uploadBufferToCloudinary(
          file.buffer,
          file.originalname,
        );

        file.path = result?.secure_url;
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};
