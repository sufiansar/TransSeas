import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { VendorController } from "./vendor.controller";

export const router = Router();

router.get("/", auth(), VendorController.getAllVendors);
router.get("/:id", auth(), VendorController.getVendorById);
export const VendorRoute = router;
