import { Router } from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";

const router = Router();
router.get("/me", auth(), AuthController.getme);
router.get("/verify", AuthController.verifyInvite);
router.post("/login", AuthController.loginUser);
router.post("/logout", AuthController.logOUtUser);
router.post("/reset-password", auth(), AuthController.resetPassword);
router.post("/forgot-password", AuthController.forgotPassword);
router.patch("/change-password", auth(), AuthController.changeUserPassword);
router.post(
  "/",
  auth(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  AuthController.createInvite,
);
router.post("/accept-invite/:token", AuthController.acceptInvite);
export const AuthRoute = router;
