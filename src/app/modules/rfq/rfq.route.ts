import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { createRFQSchema } from "./rfq.validation";
import { RFQController } from "./rfq.controller";
import { previewRFQEmail } from "./rfq.service";

export const router = Router();
router.get("/email-preview", RFQController.previewRFQEmail);
router.get("/", auth(), RFQController.getAllRFQs);
router.get("/project/:projectId", auth(), RFQController.getRFQBYProjectId);
router.get("/:rfqId", auth(), RFQController.getRFQById);
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createRFQSchema),
  RFQController.createRFQ,
);
router.patch(
  "/:rfqId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createRFQSchema.partial()),
  RFQController.updateRFQ,
);

router.delete(
  "/:rfqId",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  RFQController.deleteRFQ,
);

export const RFQRoute = router;
