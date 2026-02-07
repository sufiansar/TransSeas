import bcryptjs from "bcryptjs";
import dbConfig from "../config/db.config";
import { prisma } from "../config/prisma";
import { UserRole } from "@prisma/client";

// export const seedSuperAdmin = async () => {
//   try {
//     const isSuperAdminExist = await prisma.user.findUnique({
//       where: {
//         email: dbConfig.superAdmin.superAdmin_email!,
//       },
//     });

//     if (isSuperAdminExist) {
//       console.log("Super Admin Already Exists!");
//       return;
//     }

//     console.log("Trying to create Super Admin...");

//     const hashedPassword = await bcryptjs.hash(
//       dbConfig.superAdmin.superAdmin_password!,
//       Number(dbConfig.bcryptJs_salt),
//     );

//     const superadmin = await prisma.user.create({
//       data: {
//         name: "Ai_solution",
//         role: UserRole.SUPER_ADMIN,
//         email: dbConfig.superAdmin.superAdmin_email!,
//         passwordHash: hashedPassword,
//         isVerified: true,
//         isActive: true,
//       },
//     });
//     console.log("Super Admin Created Successfuly! \n");
//     console.log(superadmin);
//   } catch (error) {
//     console.log(error);
//   }
// };

export const seedSuperAdmin = async () => {
  try {
    // Ensure DB connection is established FIRST
    await prisma.$connect();

    const isSuperAdminExist = await prisma.user.findUnique({
      where: {
        email: dbConfig.superAdmin.superAdmin_email!,
      },
    });

    if (isSuperAdminExist) {
      console.log("Super Admin Already Exists!");
      return;
    }

    console.log("Trying to create Super Admin...");

    const hashedPassword = await bcryptjs.hash(
      dbConfig.superAdmin.superAdmin_password!,
      Number(dbConfig.bcryptJs_salt),
    );

    const superadmin = await prisma.user.create({
      data: {
        name: "Ai_solution",
        role: UserRole.SUPER_ADMIN,
        email: dbConfig.superAdmin.superAdmin_email!,
        passwordHash: hashedPassword,
        isVerified: true,
        isActive: true,
      },
    });

    console.log("Super Admin Created Successfully!");
    console.log(superadmin);
  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await prisma.$disconnect();
  }
};
