import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { IProject } from "./project.interface";
import { Currency, UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ProjectFilterableFields } from "./project.constant";

export const createProject = async (payload: IProject, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can create projects",
    );
  }

  // Validate vendor
  if (!payload.vendorId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Vendor ID is required");
  }

  const vendor = await prisma.user.findUnique({
    where: { id: payload.vendorId },
  });

  if (!vendor || vendor.role !== UserRole.VENDOR) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Selected vendor is invalid");
  }

  const newProject = await prisma.project.create({
    data: {
      name: payload.name,
      referenceNo: payload.referenceNo,
      status: payload.status,
      isActive: payload.isActive,
      vendorId: vendor.id,
      vendorName: vendor.name,
      priceLevel: payload.priceLevel || 0,
      category: payload.category,
      currency: payload.currency || Currency.USD,
      country: payload.country,
      location: payload.location,
    },
  });

  return newProject;
};

const getAllProjects = async (query: Record<string, any>) => {
  const queryBuilder = new PrismaQueryBuilder(query);

  const projectsQuery = queryBuilder
    .filter(ProjectFilterableFields)
    .search(["name", "vendorName", "referenceNo"])
    .fields()
    .sort()
    .paginate();
  const [data, meta] = await Promise.all([
    prisma.project.findMany({
      ...projectsQuery.build(),
      include: {
        items: true,
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
    queryBuilder.getMeta(prisma.project),
  ]);

  return {
    data,
    meta,
  };
};

const getProjectById = async (id: string) => {
  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
  }

  return project;
};

const updateProject = async (
  id: string,
  payload: Partial<IProject>,
  user: JwtPayload,
) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can update projects",
    );
  }

  const existingProject = await prisma.project.findUnique({
    where: { id },
  });
  if (!existingProject) {
    throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
  }

  //  Validate vendor if vendorId is being updated
  if (payload.vendorId && payload.vendorId !== existingProject.vendorId) {
    const vendor = await prisma.user.findUnique({
      where: { id: payload.vendorId },
    });
    if (!vendor || vendor.role !== UserRole.VENDOR) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Selected vendor is invalid");
    }
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      ...payload,
      vendorName: payload.vendorId
        ? (await prisma.user.findUnique({ where: { id: payload.vendorId } }))
            ?.name
        : existingProject.vendorName,
    },
  });

  return updatedProject;
};

const deleteProject = async (id: string, user: JwtPayload) => {
  if (!user) {
    throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");
  }

  if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
    throw new AppError(
      HttpStatus.FORBIDDEN,
      "Only ADMIN and SUPER_ADMIN can delete projects",
    );
  }

  const existingProject = await prisma.project.findUnique({
    where: { id },
  });

  if (!existingProject) {
    throw new AppError(HttpStatus.NOT_FOUND, "Project not found");
  }

  await prisma.project.delete({
    where: { id },
  });

  return existingProject;
};

export const ProjectService = {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
