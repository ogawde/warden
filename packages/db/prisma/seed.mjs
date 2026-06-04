import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@warden.local" },
    update: {},
    create: {
      email: "demo@warden.local",
      name: "Demo User"
    }
  });

  await prisma.repository.upsert({
    where: { gitlabProjectId: 12345678 },
    update: {},
    create: {
      gitlabProjectId: 12345678,
      pathWithNamespace: "warden-demo/debt-lab",
      name: "debt-lab",
      defaultBranch: "main",
      tokenHint: "xxxx"
    }
  });

  console.log("Seed complete", { userId: user.id });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
