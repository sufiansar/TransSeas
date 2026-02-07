import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utility/catchAsync";
import { ProjectService } from "./project.service";
import { sendResponse } from "../../utility/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status-codes";

const createProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const payload = req.body;

    const result = await ProjectService.createProject(
      payload,
      user as JwtPayload,
    );
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Project created successfully",
      data: result,
    });
  },
);

const getAllProjects = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const query = req.query;
    const projects = await ProjectService.getAllProjects(query);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Projects retrieved successfully",
      data: projects,
    });
  },
);

const getProjectById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const project = await ProjectService.getProjectById(id as string);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Project retrieved successfully",
      data: project,
    });
  },
);
const updateProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const payload = req.body;
    const user = req.user;
    const project = await ProjectService.updateProject(
      id as string,
      payload,
      user,
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Project Updated Successfully",
      data: project,
    });
  },
);

const deleteProject = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const { id } = req.params;
    const result = await ProjectService.deleteProject(id as string, user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Project deleted Successfull",
      data: result,
    });
  },
);

export const ProjectController = {
  createProject,
  getAllProjects,
  updateProject,
  getProjectById,
  deleteProject,
};
