import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/AppError";
import HttpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { IProject } from "./project.interface";
import { Currency, ProjectStatus, UserRole } from "@prisma/client";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import { ProjectFilterableFields } from "./project.constant";
import { generateProjectNumber } from "./projcet.validation";
export const createProject = async (payload: any, user: JwtPayload) => {
  if (!user) throw new AppError(HttpStatus.UNAUTHORIZED, "Unauthorized");

  if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
    throw new AppError(HttpStatus.FORBIDDEN, "Permission denied");
  }

  // const commodities = await prisma.commodity.findMany({
  //   select: {
  //     id: true,
  //     name: true,
  //   },
  // });

  const result = await prisma.$transaction(async (tx) => {
    const projectNumber = await generateProjectNumber(tx);

    const project = await tx.project.create({
      data: {
        referenceNo: projectNumber,
        name: payload.name,
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        commoditiId: payload.commoditiId || null,
        categoryId: payload.categoryId || null,
        status: payload.status || ProjectStatus.ACTIVE,
        isActive: payload.isActive ?? true,
        currency: payload.currency || Currency.USD,
        country: payload.country,
        location: payload.location,
      },
    });

    return project;
  });

  return result;
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
        items: {
          select: {
            id: true,
            itemTitle: true,
            quantity: true,
            price: true,
            unit: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        commodity: {
          select: {
            id: true,
            name: true,
          },
        },
        quotations: {
          select: {
            id: true,
            number: true,
            status: true,
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
    include: {
      items: {
        select: {
          id: true,
          itemTitle: true,
          quantity: true,
          price: true,
          unit: true,
        },
      },
      vendor: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      commodity: {
        select: {
          id: true,
          name: true,
        },
      },
      quotations: {
        select: {
          id: true,
          number: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
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

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      name: payload.projectName ?? existingProject.name,
      referenceNo: payload.referenceNo ?? existingProject.referenceNo,
      clientName: payload.clientName ?? existingProject.clientName,
      clientEmail: payload.clientEmail ?? existingProject.clientEmail,
      status: payload.status ?? existingProject.status,
      isActive: payload.isActive ?? existingProject.isActive,
      totalPrice: payload.totalPrice ?? existingProject.totalPrice,
      commoditiId: payload.commoditiId ?? existingProject.commoditiId,
      categoryId: payload.categoryId ?? existingProject.categoryId,
      currency: payload.currency ?? existingProject.currency,
      country: payload.country ?? existingProject.country,
      location: payload.location ?? existingProject.location,
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
