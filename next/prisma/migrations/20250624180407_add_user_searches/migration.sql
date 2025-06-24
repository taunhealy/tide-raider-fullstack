-- CreateTable
CREATE TABLE "UserSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "regionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSearch_userId_idx" ON "UserSearch"("userId");

-- CreateIndex
CREATE INDEX "UserSearch_createdAt_idx" ON "UserSearch"("createdAt");

-- AddForeignKey
ALTER TABLE "UserSearch" ADD CONSTRAINT "UserSearch_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
