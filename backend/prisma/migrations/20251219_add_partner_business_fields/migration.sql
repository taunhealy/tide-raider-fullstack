-- Add businessName and businessLink to PartnerProfile
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "businessName" TEXT;
ALTER TABLE "PartnerProfile" ADD COLUMN IF NOT EXISTS "businessLink" TEXT;
