import { Router } from "express";
import { CategoryController } from "./category.controller";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";

const router = Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.getAllCategories,
);
router.get(
  "/:categoryId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.getCategoryById,
);
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.createCategory,
);

router.patch(
  "/:categoryId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.updateCategory,
);
router.delete(
  "/:categoryId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.deleteCategory,
);

export const CategoryRoute = router;
