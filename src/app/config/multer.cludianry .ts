import multer from "multer";

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/webp",
];

export const multerCloudinaryUpload = multer({
  storage: multer.memoryStorage(),

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
    fileSize: 10 * 1024 * 1024,
  },
});
