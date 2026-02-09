import express from "express";
import { UserRoute } from "../modules/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { OtpRouter } from "../modules/otp/otp.route";
import { ProjectRoute } from "../modules/project/project.route";
import { ItemsRoute } from "../modules/items/items.route";
import { VendorRoute } from "../modules/vendor/vendor.route";
import { RFQRoute } from "../modules/rfq/rfq.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoute,
  },
  {
    path: "/vendor",
    route: VendorRoute,
  },
  {
    path: "/otp",
    route: OtpRouter,
  },
  {
    path: "/auth",
    route: AuthRoute,
  },
  {
    path: "/project",
    route: ProjectRoute,
  },
  {
    path: "/items",
    route: ItemsRoute,
  },

  {
    path: "/rfq",
    route: RFQRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
