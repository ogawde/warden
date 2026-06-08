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

  const gitlabProjectId = Number.parseInt(
    process.env.GITLAB_PROJECT_ID ?? "12345678",
    10
  );

  await prisma.repository.upsert({
    where: { gitlabProjectId },
    update: {},
    create: {
      gitlabProjectId,
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
