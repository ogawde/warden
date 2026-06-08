import { prisma } from "@/lib/db";

export async function getDemoUser() {
  const user = await prisma.user.findFirst({
    where: { email: "demo@warden.local" }
  });

  if (!user) {
    throw new Error("Demo user not found. Run npm run db:seed.");
  }

  return user;
}
