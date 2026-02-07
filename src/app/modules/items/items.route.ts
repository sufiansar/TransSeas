import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateItemsSchema, UpdateItemsSchema } from "./items.validation";
import { ItemsController } from "./items.controller";

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
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(CreateItemsSchema),
  ItemsController.createItem,
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
