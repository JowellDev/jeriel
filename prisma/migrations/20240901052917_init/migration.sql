-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'SUPER_ADMIN', 'TRIBE_MANAGER', 'DEPARTMENT_MANAGER', 'HONOR_FAMILY_MANAGER');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "roles" "Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "churchId" TEXT,
    "tribeId" VARCHAR(255),
    "honorFamilyId" VARCHAR(255),
    "departmentId" VARCHAR(255),

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

-- CreateTable
CREATE TABLE "tribes" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,
    "managerId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tribes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honor_families" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,
    "managerId" VARCHAR(225) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "honor_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_tribeId_idx" ON "users"("tribeId");

-- CreateIndex
CREATE INDEX "users_churchId_idx" ON "users"("churchId");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "users_departmentId_idx" ON "users"("departmentId");

-- CreateIndex
CREATE INDEX "users_honorFamilyId_idx" ON "users"("honorFamilyId");

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

-- CreateIndex
CREATE UNIQUE INDEX "tribes_managerId_key" ON "tribes"("managerId");

-- CreateIndex
CREATE INDEX "tribes_name_idx" ON "tribes"("name");

-- CreateIndex
CREATE INDEX "tribes_managerId_idx" ON "tribes"("managerId");

-- CreateIndex
CREATE INDEX "tribes_createdAt_idx" ON "tribes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "honor_families_name_key" ON "honor_families"("name");

-- CreateIndex
CREATE UNIQUE INDEX "honor_families_managerId_key" ON "honor_families"("managerId");

-- CreateIndex
CREATE INDEX "honor_families_name_idx" ON "honor_families"("name");

-- CreateIndex
CREATE INDEX "honor_families_managerId_idx" ON "honor_families"("managerId");

-- CreateIndex
CREATE INDEX "honor_families_churchId_idx" ON "honor_families"("churchId");

-- CreateIndex
CREATE INDEX "honor_families_createdAt_idx" ON "honor_families"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "tribes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_honorFamilyId_fkey" FOREIGN KEY ("honorFamilyId") REFERENCES "honor_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churches" ADD CONSTRAINT "churches_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribes" ADD CONSTRAINT "tribes_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tribes" ADD CONSTRAINT "tribes_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honor_families" ADD CONSTRAINT "honor_families_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honor_families" ADD CONSTRAINT "honor_families_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
