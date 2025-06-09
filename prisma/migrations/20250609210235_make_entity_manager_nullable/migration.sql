-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_managerId_fkey";

-- DropForeignKey
ALTER TABLE "honor_families" DROP CONSTRAINT "honor_families_managerId_fkey";

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "managerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "honor_families" ALTER COLUMN "managerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tribes" ALTER COLUMN "managerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "honor_families" ADD CONSTRAINT "honor_families_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
