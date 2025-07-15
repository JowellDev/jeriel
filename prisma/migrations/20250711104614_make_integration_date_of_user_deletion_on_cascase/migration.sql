-- DropForeignKey
ALTER TABLE "integration_dates" DROP CONSTRAINT "integration_dates_userId_fkey";

-- AddForeignKey
ALTER TABLE "integration_dates" ADD CONSTRAINT "integration_dates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
