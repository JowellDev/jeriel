-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(255) NOT NULL,
    "fullname" VARCHAR(255),
    "phone" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "userId" VARCHAR(255) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
CREATE UNIQUE INDEX "churches_userId_key" ON "churches"("userId");

-- CreateIndex
CREATE INDEX "churches_name_idx" ON "churches"("name");

-- CreateIndex
CREATE INDEX "churches_userId_idx" ON "churches"("userId");

-- CreateIndex
CREATE INDEX "churches_createdAt_idx" ON "churches"("createdAt");

-- AddForeignKey
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "churches" ADD CONSTRAINT "churches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
