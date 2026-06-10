-- DropIndex
DROP INDEX "Repository_gitlabProjectId_key";

-- AlterTable
ALTER TABLE "Repository" ADD COLUMN     "selectedAt" TIMESTAMP(3),
ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Repository_userId_selectedAt_idx" ON "Repository"("userId", "selectedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_gitlabProjectId_key" ON "Repository"("userId", "gitlabProjectId");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
