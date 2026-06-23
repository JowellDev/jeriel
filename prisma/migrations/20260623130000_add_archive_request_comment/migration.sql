-- Add an optional rejection comment to archive requests.
ALTER TABLE "archive_requests" ADD COLUMN "comment" TEXT;
