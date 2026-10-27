-- ExitPrep Ethiopia: Authentication & Roles Update Migration
-- Migration: 20261027000001_auth_sessions

-- AlterTable User to support email or phone registration
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone");

-- AlterTable Session to support persistent session metadata
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "ipAddress" TEXT;
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions"("token");
