import type { User } from "@warden/db";
import { prisma } from "@/lib/db";
import { getWardenSession } from "@/lib/auth/session";

export async function getSessionUser(): Promise<User | null> {
  const session = await getWardenSession();

  if (!session.userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId }
  });

  return user;
}

export async function requireSession(): Promise<User> {
  const user = await getSessionUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}
