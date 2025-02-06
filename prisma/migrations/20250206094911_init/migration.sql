-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBER', 'SUPER_ADMIN', 'TRIBE_MANAGER', 'DEPARTMENT_MANAGER', 'HONOR_FAMILY_MANAGER');

-- CreateEnum
CREATE TYPE "AttendanceReportEntity" AS ENUM ('TRIBE', 'DEPARTMENT', 'HONOR_FAMILY');

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
    "deletedAt" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" VARCHAR(255) NOT NULL,

    CONSTRAINT "tribes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "honor_families" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,
    "managerId" VARCHAR(225) NOT NULL,

    CONSTRAINT "honor_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "managerId" VARCHAR(255) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive_requests" (
    "id" VARCHAR(255) NOT NULL,
    "origin" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "churchId" VARCHAR(255) NOT NULL,
    "requesterId" VARCHAR(255) NOT NULL,

    CONSTRAINT "archive_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" VARCHAR(255) NOT NULL,
    "from" TIMESTAMP(3) NOT NULL,
    "to" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tribeId" VARCHAR(255),
    "departmentId" VARCHAR(255),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_dates" (
    "id" VARCHAR(255) NOT NULL,
    "tribeDate" TIMESTAMP(3),
    "familyDate" TIMESTAMP(3),
    "departementDate" TIMESTAMP(3),
    "userId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_reports" (
    "id" VARCHAR(255) NOT NULL,
    "entity" "AttendanceReportEntity" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" VARCHAR(255),
    "tribeId" VARCHAR(255),
    "honorFamilyId" VARCHAR(255),
    "submitterId" TEXT NOT NULL,

    CONSTRAINT "attendance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" VARCHAR(255) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inChurch" BOOLEAN NOT NULL DEFAULT false,
    "inService" BOOLEAN,
    "inMeeting" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasConflict" BOOLEAN NOT NULL DEFAULT false,
    "memberId" TEXT NOT NULL,
    "reportId" VARCHAR(255) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_usersToArchive" (
    "A" VARCHAR(255) NOT NULL,
    "B" VARCHAR(255) NOT NULL,

    CONSTRAINT "_usersToArchive_AB_pkey" PRIMARY KEY ("A","B")
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
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

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
CREATE INDEX "churches_isActive_idx" ON "churches"("isActive");

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

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_managerId_key" ON "departments"("managerId");

-- CreateIndex
CREATE INDEX "departments_name_idx" ON "departments"("name");

-- CreateIndex
CREATE INDEX "departments_managerId_idx" ON "departments"("managerId");

-- CreateIndex
CREATE INDEX "departments_createdAt_idx" ON "departments"("createdAt");

-- CreateIndex
CREATE INDEX "departments_churchId_idx" ON "departments"("churchId");

-- CreateIndex
CREATE INDEX "archive_requests_createdAt_idx" ON "archive_requests"("createdAt");

-- CreateIndex
CREATE INDEX "archive_requests_churchId_idx" ON "archive_requests"("churchId");

-- CreateIndex
CREATE INDEX "archive_requests_requesterId_idx" ON "archive_requests"("requesterId");

-- CreateIndex
CREATE INDEX "services_from_idx" ON "services"("from");

-- CreateIndex
CREATE INDEX "services_to_idx" ON "services"("to");

-- CreateIndex
CREATE INDEX "services_createdAt_idx" ON "services"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "integration_dates_userId_key" ON "integration_dates"("userId");

-- CreateIndex
CREATE INDEX "integration_dates_tribeDate_idx" ON "integration_dates"("tribeDate");

-- CreateIndex
CREATE INDEX "integration_dates_familyDate_idx" ON "integration_dates"("familyDate");

-- CreateIndex
CREATE INDEX "integration_dates_departementDate_idx" ON "integration_dates"("departementDate");

-- CreateIndex
CREATE INDEX "integration_dates_userId_idx" ON "integration_dates"("userId");

-- CreateIndex
CREATE INDEX "integration_dates_createdAt_idx" ON "integration_dates"("createdAt");

-- CreateIndex
CREATE INDEX "attendance_reports_entity_idx" ON "attendance_reports"("entity");

-- CreateIndex
CREATE INDEX "attendance_reports_createdAt_idx" ON "attendance_reports"("createdAt");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_inChurch_idx" ON "attendances"("inChurch");

-- CreateIndex
CREATE INDEX "attendances_inService_idx" ON "attendances"("inService");

-- CreateIndex
CREATE INDEX "attendances_inMeeting_idx" ON "attendances"("inMeeting");

-- CreateIndex
CREATE INDEX "attendances_createdAt_idx" ON "attendances"("createdAt");

-- CreateIndex
CREATE INDEX "attendances_hasConflict_idx" ON "attendances"("hasConflict");

-- CreateIndex
CREATE INDEX "_usersToArchive_B_index" ON "_usersToArchive"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "tribes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_honorFamilyId_fkey" FOREIGN KEY ("honorFamilyId") REFERENCES "honor_families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "departments" ADD CONSTRAINT "departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_requests" ADD CONSTRAINT "archive_requests_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "churches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archive_requests" ADD CONSTRAINT "archive_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "tribes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_dates" ADD CONSTRAINT "integration_dates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_reports" ADD CONSTRAINT "attendance_reports_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_reports" ADD CONSTRAINT "attendance_reports_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "tribes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_reports" ADD CONSTRAINT "attendance_reports_honorFamilyId_fkey" FOREIGN KEY ("honorFamilyId") REFERENCES "honor_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_reports" ADD CONSTRAINT "attendance_reports_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "attendance_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersToArchive" ADD CONSTRAINT "_usersToArchive_A_fkey" FOREIGN KEY ("A") REFERENCES "archive_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_usersToArchive" ADD CONSTRAINT "_usersToArchive_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
