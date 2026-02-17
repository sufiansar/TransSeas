import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { VendorController } from "./vendor.controller";

export const router = Router();

router.get("/", auth(), VendorController.getAllVendors);
router.get("/:id", auth(), VendorController.getVendorById);
router.post("/", auth(), VendorController.addVendor);
router.patch("/:id", auth(), VendorController.updateVendor);
router.delete("/:id", auth(), VendorController.deleteVendor);
export const VendorRoute = router;
