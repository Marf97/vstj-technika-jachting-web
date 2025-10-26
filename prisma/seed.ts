import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@example.com";
  const memberEmail = "member@example.com";

  const [adminPass, memberPass] = await Promise.all([
    hash("admin123", 10),
    hash("member123", 10),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, passwordHash: adminPass, name: "Admin" },
    create: {
      email: adminEmail,
      role: Role.ADMIN,
      passwordHash: adminPass,
      name: "Admin",
    },
  });

  await prisma.user.upsert({
    where: { email: memberEmail },
    update: { role: Role.MEMBER, passwordHash: memberPass, name: "Member" },
    create: {
      email: memberEmail,
      role: Role.MEMBER,
      passwordHash: memberPass,
      name: "Member",
    },
  });

  console.log("Seed done: admin/member users created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
