import { Router } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { userCreateSchema, userUpdateSchema } from "./user.validation";
import { multerUpload } from "../../config/multer.config";

const router = Router();
router.get("/my-profile", auth(), UserController.getMyProfile);
router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getAllUsers,
);
router.get(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.getUserById,
);
router.post(
  "/create",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single("profileImage"),
  validateRequest(userCreateSchema),
  UserController.createUser,
);
router.patch(
  "/:id",
  auth(),
  multerUpload.single("profileImage"),
  validateRequest(userUpdateSchema),
  UserController.updateUser,
);
router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserController.deleteUser,
);

export const UserRoute = router;
