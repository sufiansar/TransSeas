import { Router } from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/checkAuth";

const router = Router();
router.get("/me", auth(), AuthController.getme);
router.post("/login", AuthController.loginUser);
router.post("/logout", AuthController.logOUtUser);
router.post("/reset-password", auth(), AuthController.resetPassword);
router.post("/forgot-password", AuthController.forgotPassword);
router.patch("/change-password", auth(), AuthController.changeUserPassword);
export const AuthRoute = router;
