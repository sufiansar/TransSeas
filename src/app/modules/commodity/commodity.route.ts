import e, { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { CommodityController } from "./commodity.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  createCommoditySchema,
  updateCommoditySchema,
} from "./commodity.validation";

const router = Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CommodityController.getAllCommodities,
);

router.get(
  "/:commodityId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CommodityController.getCommodityById,
);
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createCommoditySchema),
  CommodityController.createCommodity,
);

router.patch(
  "/:commodityId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateCommoditySchema),
  CommodityController.updateCommodity,
);

router.delete(
  "/:commodityId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CommodityController.deleteCommodity,
);

export const CommodityRoute = router;
