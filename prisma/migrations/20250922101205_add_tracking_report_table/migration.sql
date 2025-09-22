-- CreateTable
CREATE TABLE "report_tracking" (
    "id" VARCHAR(255) NOT NULL,
    "entity" "AttendanceReportEntity" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "departmentId" VARCHAR(255),
    "tribeId" VARCHAR(255),
    "honorFamilyId" VARCHAR(255),
    "reportId" VARCHAR(255),
    "submitterId" VARCHAR(255) NOT NULL,

    CONSTRAINT "report_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "report_tracking_entity_idx" ON "report_tracking"("entity");

-- CreateIndex
CREATE INDEX "report_tracking_submittedAt_idx" ON "report_tracking"("submittedAt");

-- CreateIndex
CREATE INDEX "report_tracking_createdAt_idx" ON "report_tracking"("createdAt");

-- CreateIndex
CREATE INDEX "report_tracking_submitterId_idx" ON "report_tracking"("submitterId");

-- AddForeignKey
ALTER TABLE "report_tracking" ADD CONSTRAINT "report_tracking_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tracking" ADD CONSTRAINT "report_tracking_tribeId_fkey" FOREIGN KEY ("tribeId") REFERENCES "tribes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tracking" ADD CONSTRAINT "report_tracking_honorFamilyId_fkey" FOREIGN KEY ("honorFamilyId") REFERENCES "honor_families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_tracking" ADD CONSTRAINT "report_tracking_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
