import { Router } from "express";
import auth from "../../middlewares/checkAuth";
import { UserRole } from "@prisma/client";
import { validateRequest } from "../../middlewares/validateRequest";
import { CreateProjectSchema, UpdateProjectSchema } from "./projcet.validation";
import { ProjectController } from "./project.controller";

const router = Router();

router.get("/", auth(), ProjectController.getAllProjects);
router.get("/:id", auth(), ProjectController.getProjectById);
router.post(
  "/",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(CreateProjectSchema),
  ProjectController.createProject,
);

router.patch(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(UpdateProjectSchema),
  ProjectController.updateProject,
);

router.delete(
  "/:id",
  auth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  ProjectController.deleteProject,
);

export const ProjectRoute = router;
