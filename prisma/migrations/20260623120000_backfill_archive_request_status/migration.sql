-- Backfill legacy archive_requests rows whose status was never set (NULL).
-- A request is considered COMPLETED when it has at least one linked user and
-- every linked user is already archived (isActive = false AND deletedAt set).
-- Any remaining NULL row is treated as still PENDING.

UPDATE "archive_requests" AS ar
SET "status" = 'COMPLETED'
WHERE ar."status" IS NULL
  AND EXISTS (
    SELECT 1 FROM "_usersToArchive" j WHERE j."A" = ar."id"
  )
  AND NOT EXISTS (
    SELECT 1
    FROM "_usersToArchive" j
    JOIN "users" u ON u."id" = j."B"
    WHERE j."A" = ar."id"
      AND (u."isActive" = true OR u."deletedAt" IS NULL)
  );

UPDATE "archive_requests"
SET "status" = 'PENDING'
WHERE "status" IS NULL;
