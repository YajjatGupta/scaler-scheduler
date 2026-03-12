import { prisma } from "./prisma.js";

export async function getDefaultUser() {
  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" }
  });

  if (!user) {
    throw new Error("No default user found. Run the Prisma seed script first.");
  }

  return user;
}
