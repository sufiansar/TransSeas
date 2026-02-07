import express from "express";
import { UserRoute } from "../modules/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { OtpRouter } from "../modules/otp/otp.route";
import { ProjectRoute } from "../modules/project/project.route";
import { ItemsRoute } from "../modules/items/items.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoute,
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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
