// // import { excludeField } from "../constant";
// import HttpStatus from "http-status";
// import AppError from "../errorHelpers/AppError";
// import { Prisma } from "@prisma/client";

// export class PrismaQueryBuilder {
//   private query: Record<string, string>;
//   private prismaQuery: Prisma.Enumerable<any> & {
//     where?: any;
//     orderBy?: any;
//     select?: any;
//     skip?: number;
//     take?: number;
//   };

//   constructor(query: Record<string, string>) {
//     this.query = query;
//     this.prismaQuery = {};
//   }

//   // filter(filterableFields?: Record<string, (value: string) => any>): this {
//   //   if (!filterableFields) return this;

//   //   const andConditions: any[] = [];

//   //   for (const [key, value] of Object.entries(this.query)) {
//   //     if (excludeField.includes(key)) continue;
//   //     if (!filterableFields[key]) continue;

//   //     andConditions.push(filterableFields[key](value));
//   //   }

//   //   if (andConditions.length) {
//   //     this.prismaQuery.where = {
//   //       ...(this.prismaQuery.where || {}),
//   //       AND: andConditions,
//   //     };
//   //   }

//   //   return this;
//   // }

//   filter(): this {
//     const queryObj: any = { ...this.query };

//     const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
//     excludeFields.forEach((f) => delete queryObj[f]);

//     const where: Record<string, any> = {};

//     // Allowed Prisma operators
//     const operatorMap: Record<string, string> = {
//       gt: "gt",
//       gte: "gte",
//       lt: "lt",
//       lte: "lte",
//       equals: "equals",
//       in: "in",
//     };

//     for (const [field, rawValue] of Object.entries(queryObj)) {
//       // Supports: price[gte]=100 style
//       if (typeof rawValue === "object" && rawValue !== null) {
//         where[field] = {};

//         for (const [op, val] of Object.entries(rawValue)) {
//           if (!operatorMap[op]) {
//             throw new AppError(
//               HttpStatus.BAD_REQUEST,
//               `Invalid filter operator: ${op}`,
//             );
//           }

//           // Handle array values for `in`
//           if (op === "in") {
//             where[field][op] = String(val)
//               .split(",")
//               .map((v) => (isNaN(+v) ? v : +v));
//             continue;
//           }

//           const num = Number(val);

//           if (isNaN(num)) {
//             throw new AppError(
//               HttpStatus.BAD_REQUEST,
//               `Filter value for ${field}.${op} must be a number`,
//             );
//           }

//           where[field][op] = num;
//         }
//       } else {
//         // Exact match (status=active etc.)
//         where[field] = rawValue;
//       }
//     }

//     this.prismaQuery.where = {
//       AND: [...(this.prismaQuery.where?.AND || []), where],
//     };

//     return this;
//   }

//   search(searchableFields: string[]): this {
//     const searchTerm = this.query.searchTerm;

//     if (!searchTerm) return this;

//     const orConditions = searchableFields.map((field) => ({
//       [field]: {
//         contains: searchTerm,
//         mode: "insensitive",
//       },
//     }));

//     this.prismaQuery.where = {
//       AND: [...(this.prismaQuery.where?.AND || []), { OR: orConditions }],
//     };

//     return this;
//   }

//   sort(): this {
//     const sort = this.query.sort || "createdAt";
//     const order = sort.startsWith("-") ? "desc" : "asc";
//     const field = sort.replace("-", "");

//     this.prismaQuery.orderBy = {
//       [field]: order,
//     };

//     return this;
//   }

//   fields(): this {
//     if (!this.query.fields) return this;

//     const fieldsArray = this.query.fields.split(",");

//     this.prismaQuery.select = fieldsArray.reduce(
//       (acc, field) => {
//         acc[field] = true;
//         return acc;
//       },
//       {} as Record<string, boolean>,
//     );

//     return this;
//   }

//   paginate(): this {
//     const page = Number(this.query.page) || 1;
//     const limit = Number(this.query.limit) || 10;
//     const skip = (page - 1) * limit;

//     this.prismaQuery.skip = skip;
//     this.prismaQuery.take = limit;

//     return this;
//   }

//   build() {
//     return this.prismaQuery;
//   }

// async getMeta(model: any) {
//   const page = Number(this.query.page) || 1;
//   const limit = Number(this.query.limit) || 10;

//   const total = await model.count({
//     where: this.prismaQuery.where,
//   });

//   const totalPage = Math.ceil(total / limit);

//   return {
//     page,
//     limit,
//     total,
//     totalPage,
//   };
// }
// }

import HttpStatus from "http-status";
import AppError from "../errorHelpers/AppError";

type QueryParams = Record<string, any>;

export class PrismaQueryBuilder {
  private query: QueryParams;
  private prismaQuery: {
    where?: any;
    orderBy?: any;
    select?: any;
    skip?: number;
    take?: number;
  };

  constructor(query: QueryParams) {
    this.query = query;
    this.prismaQuery = {};
  }

  // ------------------------
  // Utility: smart cast value
  // ------------------------
  private castValue(value: any) {
    if (value === "true") return true;
    if (value === "false") return false;

    if (!isNaN(value)) return Number(value);

    // ISO date support
    if (!isNaN(Date.parse(value))) return new Date(value);

    return value;
  }

  // ------------------------
  // FILTER
  // ------------------------
  // filter(): this {
  //   const queryObj = { ...this.query };

  //   const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
  //   excludeFields.forEach((f) => delete queryObj[f]);

  //   const where: Record<string, any> = {};

  //   const allowedOperators = ["gt", "gte", "lt", "lte", "equals", "in", "not"];

  //   for (const [field, value] of Object.entries(queryObj)) {
  //     // price[gte]=100
  //     if (typeof value === "object" && value !== null) {
  //       where[field] = {};

  //       for (const [op, val] of Object.entries(value)) {
  //         if (!allowedOperators.includes(op)) {
  //           throw new AppError(
  //             HttpStatus.BAD_REQUEST,
  //             `Invalid operator: ${op}`,
  //           );
  //         }

  //         if (op === "in") {
  //           where[field][op] = String(val)
  //             .split(",")
  //             .map((v) => this.castValue(v));
  //         } else {
  //           where[field][op] = this.castValue(val);
  //         }
  //       }
  //     }

  //     // status=active
  //     else {
  //       where[field] = this.castValue(value);
  //     }
  //   }

  //   this.prismaQuery.where = {
  //     ...(this.prismaQuery.where || {}),
  //     ...where,
  //   };

  //   return this;
  // }
  filter(filterableFields?: string[]): this {
    const queryObj = { ...this.query };

    // remove non-filter params
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((f) => delete queryObj[f]);

    const where: Record<string, any> = {};

    const allowedOperators = ["gt", "gte", "lt", "lte", "equals", "in", "not"];

    for (const [field, value] of Object.entries(queryObj)) {
      // ✅ If whitelist exists → enforce it
      if (filterableFields && !filterableFields.includes(field)) continue;

      if (typeof value === "object" && value !== null) {
        where[field] = {};

        for (const [op, val] of Object.entries(value)) {
          if (!allowedOperators.includes(op)) {
            throw new AppError(
              HttpStatus.BAD_REQUEST,
              `Invalid operator: ${op}`,
            );
          }

          if (op === "in") {
            where[field][op] = String(val)
              .split(",")
              .map((v) => this.castValue(v));
          } else {
            where[field][op] = this.castValue(val);
          }
        }
      } else {
        where[field] = this.castValue(value);
      }
    }

    // ✅ merge safely with existing Prisma where (ex: search)
    this.prismaQuery.where = {
      ...(this.prismaQuery.where || {}),
      ...where,
    };

    return this;
  }

  // ------------------------
  // SEARCH
  // ------------------------
  search(searchableFields: string[]): this {
    const term = this.query.searchTerm;

    if (!term) return this;

    const or = searchableFields.map((field) => ({
      [field]: {
        contains: term,
        mode: "insensitive",
      },
    }));

    this.prismaQuery.where = {
      ...(this.prismaQuery.where || {}),
      OR: or,
    };

    return this;
  }

  // ------------------------
  // SORT
  // ------------------------
  sort(): this {
    const sort = this.query.sort || "-createdAt";

    const orderBy = sort.split(",").map((field: string) => {
      if (field.startsWith("-")) {
        return { [field.slice(1)]: "desc" };
      }
      return { [field]: "asc" };
    });

    this.prismaQuery.orderBy = orderBy;

    return this;
  }

  // ------------------------
  // SELECT FIELDS
  // ------------------------
  fields(): this {
    if (!this.query.fields) return this;

    const select: Record<string, boolean> = {};

    this.query.fields.split(",").forEach((f: string) => {
      select[f] = true;
    });

    this.prismaQuery.select = select;

    return this;
  }

  // ------------------------
  // PAGINATION
  // ------------------------
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    this.prismaQuery.skip = (page - 1) * limit;
    this.prismaQuery.take = limit;

    return this;
  }

  // ------------------------
  // BUILD
  // ------------------------
  build() {
    return this.prismaQuery;
  }

  // ------------------------
  // META DATA
  // ------------------------

  async getMeta(model: any) {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;

    const total = await model.count({
      where: this.prismaQuery.where,
    });

    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}
