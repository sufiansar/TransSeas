import { UserRole } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { PrismaQueryBuilder } from "../../utility/queryBuilder";
import {
  VendorFilterableFields,
  VendorSearchableFields,
} from "./vendor.constant";

const getAllVendors = async (query: any) => {
  const prismaQuery = new PrismaQueryBuilder(query);

  const builtQuery = prismaQuery
    .filter(VendorFilterableFields)
    .search(VendorSearchableFields)
    .fields()
    .sort()
    .paginate()
    .build();

  builtQuery.where = {
    AND: [builtQuery.where || {}, { role: UserRole.VENDOR }],
  };

  const [data, meta] = await Promise.all([
    prisma.user.findMany({
      ...builtQuery,
    }),
    prismaQuery.getMeta(prisma.user),
  ]);

  return { data, meta };
};

const getVendorById = async (vendorId: string) => {
  if (!vendorId) {
    throw new Error("Vendor ID is required");
  }
  const vendor = await prisma.user.findUnique({
    where: { id: vendorId, role: UserRole.VENDOR },
  });
  if (!vendor) {
    throw new Error("Vendor not found");
  }
  return vendor;
};
export const VendorService = {
  getAllVendors,
  getVendorById,
};
