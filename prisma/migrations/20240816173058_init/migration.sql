-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'TRIBE_MANAGER', 'HONER_FAMILY_MANAGER');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255),
    "phone" VARCHAR(255) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roles" "Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "churchId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passwords" (
    "hash" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" VARCHAR(255) NOT NULL,
    "algorithm" VARCHAR(255) NOT NULL,
    "secret" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "digits" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "churches" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" VARCHAR(255) NOT NULL,

    CONSTRAINT "churches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_fullname_idx" ON "users"("fullname");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "passwords_userId_key" ON "passwords"("userId");

-- CreateIndex
CREATE INDEX "passwords_userId_idx" ON "passwords"("userId");

-- CreateIndex
CREATE INDEX "verifications_phone_idx" ON "verifications"("phone");

-- CreateIndex
CREATE INDEX "verifications_expiresAt_idx" ON "verifications"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "churches_name_key" ON "churches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "churches_adminId_key" ON "churches"("adminId");

-- CreateIndex
CREATE INDEX "churches_name_idx" ON "churches"("name");

-- CreateIndex
CREATE INDEX "churches_adminId_idx" ON "churches"("adminId");

-- CreateIndex
CREATE INDEX "churches_createdAt_idx" ON "churches"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churches" ADD CONSTRAINT "churches_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
