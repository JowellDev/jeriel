-- First, handle any duplicate emails by setting duplicates to NULL
-- This keeps the first occurrence and nullifies duplicates
WITH ranked_emails AS (
  SELECT
    id,
    email,
    ROW_NUMBER() OVER (PARTITION BY email ORDER BY "createdAt" ASC) as rn
  FROM users
  WHERE email IS NOT NULL AND email != ''
)
UPDATE users
SET email = NULL
WHERE id IN (
  SELECT id FROM ranked_emails WHERE rn > 1
);

-- Now add the unique constraint on email
-- This will fail if there are still duplicates, which means the above didn't work
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- AlterTable - Add unique constraint to email column
ALTER TABLE "users"
  DROP CONSTRAINT IF EXISTS "users_email_key";

ALTER TABLE "users"
  ADD CONSTRAINT "users_email_key" UNIQUE ("email");
