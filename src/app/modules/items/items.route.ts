import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateItemsSchema, UpdateItemsSchema } from "./items.validation";
import { ItemsController } from "./items.controller";
import multer from "multer";
import { upload } from "../../config/multer.config";

const router = Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ItemsController.getAllItems,
);
router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ItemsController.getItemById,
);
router.post(
  "/upload",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  upload.fields([
    { name: "excel_file", maxCount: 1 },
    { name: "pdf_file", maxCount: 1 },
  ]),
  ItemsController.uploadPdfAndExcelFiles,
);
router.get(
  "/upload/batch/:batchId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ItemsController.getUploadBatchItems,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UpdateItemsSchema),
  ItemsController.updateItem,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ItemsController.deleteItem,
);

export const ItemsRoute = router;
