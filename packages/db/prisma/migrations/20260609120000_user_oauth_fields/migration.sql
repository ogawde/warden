-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessTokenEnc" TEXT,
ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "gitlabUserId" INTEGER,
ADD COLUMN     "gitlabUsername" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "refreshTokenEnc" TEXT,
ADD COLUMN     "tokenExpiresAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_gitlabUserId_key" ON "User"("gitlabUserId");
