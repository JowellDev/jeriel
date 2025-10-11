/*
  Warnings:

  - You are about to drop the column `period` on the `verifications` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `verifications` table. All the data in the column will be lost.
  - Added the required column `email` to the `verifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `step` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."users_phone_key";

-- DropIndex
DROP INDEX "public"."verifications_phone_idx";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "email" VARCHAR(255),
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "period",
DROP COLUMN "phone",
ADD COLUMN     "email" VARCHAR(255) NOT NULL,
ADD COLUMN     "step" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "verifications_email_idx" ON "verifications"("email");
