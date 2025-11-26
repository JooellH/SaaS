-- Create enums if they do not exist
DO $$
BEGIN
  CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

DO $$
BEGIN
  CREATE TYPE "StaffStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END$$;

-- Booking adjustments
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "clientEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Business adjustments
ALTER TABLE "Business"
  ADD COLUMN IF NOT EXISTS "bannerUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "brandColor" TEXT,
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Business"
  ALTER COLUMN "timezone" SET DEFAULT 'UTC';

-- MessageLog adjustments
ALTER TABLE "MessageLog"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Schedule: add interval-based model and migrate existing data
ALTER TABLE "Schedule"
  ADD COLUMN IF NOT EXISTS "intervals" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE "Schedule"
SET "intervals" = CASE
  WHEN "breakStart" IS NOT NULL AND "breakEnd" IS NOT NULL THEN
    jsonb_build_array(
      jsonb_build_object('start', "openTime", 'end', "breakStart"),
      jsonb_build_object('start', "breakEnd", 'end', "closeTime")
    )
  ELSE
    jsonb_build_array(jsonb_build_object('start', "openTime", 'end', "closeTime"))
END
WHERE jsonb_array_length(COALESCE("intervals", '[]'::jsonb)) = 0;

ALTER TABLE "Schedule"
  DROP COLUMN IF EXISTS "breakEnd",
  DROP COLUMN IF EXISTS "breakStart",
  DROP COLUMN IF EXISTS "closeTime",
  DROP COLUMN IF EXISTS "openTime";

-- Service adjustments
ALTER TABLE "Service"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE "Service"
  ALTER COLUMN "cleaningTimeMinutes" SET DEFAULT 0;

-- Staff adjustments
ALTER TABLE "Staff"
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "inviteToken" TEXT,
  ADD COLUMN IF NOT EXISTS "permissions" JSONB,
  ADD COLUMN IF NOT EXISTS "phone" TEXT,
  ADD COLUMN IF NOT EXISTS "status" "StaffStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Convert existing role column to enum-backed role
ALTER TABLE "Staff"
  ADD COLUMN IF NOT EXISTS "role_new" "Role" NOT NULL DEFAULT 'STAFF';

UPDATE "Staff"
SET "role_new" = CASE
  WHEN lower(COALESCE(CAST("role" AS TEXT), 'staff')) = 'owner' THEN 'OWNER'::"Role"
  ELSE 'STAFF'::"Role"
END;

ALTER TABLE "Staff"
  DROP COLUMN IF EXISTS "role";

ALTER TABLE "Staff"
  RENAME COLUMN "role_new" TO "role";

-- Ensure email is populated and non-null
UPDATE "Staff"
SET "email" = COALESCE("email", concat('placeholder-', "id", '@example.com'));

ALTER TABLE "Staff"
  ALTER COLUMN "email" SET NOT NULL;

-- New tables
CREATE TABLE IF NOT EXISTS "SpecialDay" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "isClosed" BOOLEAN NOT NULL DEFAULT false,
    "intervals" JSONB,
    "reason" TEXT,

    CONSTRAINT "SpecialDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ActionLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ErrorLog" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "source" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SecurityLog" (
    "id" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "limits" JSONB NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Subscription_businessId_key" ON "Subscription"("businessId");
CREATE UNIQUE INDEX IF NOT EXISTS "Schedule_businessId_weekday_key" ON "Schedule"("businessId", "weekday");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_inviteToken_key" ON "Staff"("inviteToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Staff_businessId_email_key" ON "Staff"("businessId", "email");

-- Foreign keys
ALTER TABLE "SpecialDay" ADD CONSTRAINT "SpecialDay_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ErrorLog" ADD CONSTRAINT "ErrorLog_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
