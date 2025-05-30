-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SleepingType" AS ENUM ('COUCH', 'PRIVATE_ROOM', 'SHARED_ROOM', 'AIR_MATTRESS', 'MATTRESS', 'BUNK');

-- CreateEnum
CREATE TYPE "BoardType" AS ENUM ('SHORTBOARD', 'LONGBOARD', 'FISH', 'FUNBOARD', 'SUP', 'GUN', 'MINI_MAL');

-- CreateEnum
CREATE TYPE "FinType" AS ENUM ('THRUSTER', 'TWIN', 'QUAD', 'SINGLE', 'FIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "BeachGoodRating" (
    "id" TEXT NOT NULL,
    "beachId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BeachGoodRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdRequest" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "imageUrl" TEXT,
    "linkUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "lemonSubscriptionId" TEXT,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "categoryData" JSONB,
    "googleAdsCampaignId" TEXT,
    "googleAdsContribution" DOUBLE PRECISION NOT NULL,
    "regionId" TEXT NOT NULL,
    "title" TEXT,
    "yearlyPrice" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "payfastSubscriptionId" TEXT,
    "variantId" TEXT,

    CONSTRAINT "AdRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "nationality" TEXT,
    "password" TEXT,
    "skillLevel" "SkillLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lemonCustomerId" TEXT,
    "lemonSubscriptionId" TEXT,
    "savedFilters" JSONB,
    "hasActiveTrial" BOOLEAN NOT NULL DEFAULT false,
    "hasTrialEnded" BOOLEAN NOT NULL DEFAULT false,
    "trialEndDate" TIMESTAMP(3),
    "trialStartDate" TIMESTAMP(3),
    "bio" TEXT,
    "link" TEXT,
    "subscriptionEndsAt" TIMESTAMP(3),
    "subscriptionStatus" TEXT,
    "paypalSubscriptionId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogEntry" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "surferName" TEXT,
    "surferEmail" TEXT,
    "beachName" TEXT,
    "surferRating" DOUBLE PRECISION,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "continent" TEXT,
    "country" TEXT,
    "region" TEXT,
    "waveType" TEXT,
    "beachId" TEXT,
    "forecast" JSONB,
    "user_id" TEXT,

    CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafariBooking" (
    "id" TEXT NOT NULL,
    "safariId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bringingBoard" BOOLEAN NOT NULL DEFAULT false,
    "requiresRental" BOOLEAN NOT NULL DEFAULT false,
    "skillLevel" "SkillLevel" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boardId" TEXT,

    CONSTRAINT "SafariBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurfSafariListing" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "profileImage" TEXT,
    "price" DOUBLE PRECISION,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "hasVehicleTransport" BOOLEAN NOT NULL DEFAULT false,
    "canTransportLongboard" BOOLEAN NOT NULL DEFAULT false,
    "canTransportShortboard" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SurfSafariListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachSafariConnection" (
    "id" TEXT NOT NULL,
    "beachId" TEXT NOT NULL,
    "safariId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,

    CONSTRAINT "BeachSafariConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beach" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "continent" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "distanceFromCT" DOUBLE PRECISION NOT NULL,
    "optimalWindDirections" TEXT[],
    "optimalSwellDirections" JSONB NOT NULL,
    "bestSeasons" TEXT[],
    "optimalTide" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "waveType" TEXT NOT NULL,
    "swellSize" JSONB NOT NULL,
    "idealSwellPeriod" JSONB NOT NULL,
    "waterTemp" JSONB NOT NULL,
    "hazards" TEXT[],
    "crimeLevel" TEXT NOT NULL,
    "sharkAttack" JSONB NOT NULL,
    "image" TEXT,
    "coordinates" JSONB NOT NULL,
    "videos" JSONB,
    "profileImage" TEXT,
    "advertisingPrice" DOUBLE PRECISION,
    "coffeeShop" JSONB,
    "hasSharkAlert" BOOLEAN,
    "bestMonthOfYear" TEXT,
    "isHiddenGem" BOOLEAN,
    "sheltered" BOOLEAN,

    CONSTRAINT "Beach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lemonSqueezyId" TEXT,
    "variantId" INTEGER,
    "checkoutUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BoardType" NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "finSetup" "FinType" NOT NULL,
    "images" TEXT[],
    "thumbnail" TEXT,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastA" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "windSpeed" INTEGER NOT NULL DEFAULT 0,
    "windDirection" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swellHeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "swellPeriod" INTEGER NOT NULL DEFAULT 0,
    "swellDirection" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ForecastA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastB" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "forecast" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastB_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL,
    "beachId" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "improvements" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,
    "beachName" TEXT,
    "beachId" TEXT,
    "regionId" TEXT,
    "customBeach" TEXT,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFilters" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserFilters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "videoLink" VARCHAR(2048) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thumbnail" TEXT,
    "images" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rentPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "specifications" JSONB NOT NULL,

    CONSTRAINT "RentalItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeachRentalConnection" (
    "id" TEXT NOT NULL,
    "rentalItemId" TEXT NOT NULL,
    "beachId" TEXT NOT NULL,

    CONSTRAINT "BeachRentalConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalItemRequest" (
    "id" TEXT NOT NULL,
    "rentalItemId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "beachId" TEXT NOT NULL,
    "totalCost" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastActionAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "modificationCount" INTEGER NOT NULL DEFAULT 0,
    "previousVersions" JSONB,
    "cancellationReason" TEXT,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "hasBeenViewed" BOOLEAN NOT NULL DEFAULT false,
    "viewedAt" TIMESTAMP(3),
    "paymentIntentId" TEXT,
    "depositPaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RentalItemRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalItemAvailability" (
    "id" TEXT NOT NULL,
    "rentalItemId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalItemAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalChatMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentalChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "continent" TEXT,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BeachGoodRating_date_region_idx" ON "BeachGoodRating"("date", "region");

-- CreateIndex
CREATE INDEX "BeachGoodRating_beachId_date_idx" ON "BeachGoodRating"("beachId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BeachGoodRating_beachId_date_key" ON "BeachGoodRating"("beachId", "date");

-- CreateIndex
CREATE INDEX "AdRequest_payfastSubscriptionId_idx" ON "AdRequest"("payfastSubscriptionId");

-- CreateIndex
CREATE INDEX "AdRequest_regionId_idx" ON "AdRequest"("regionId");

-- CreateIndex
CREATE INDEX "AdRequest_category_idx" ON "AdRequest"("category");

-- CreateIndex
CREATE INDEX "AdRequest_status_idx" ON "AdRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_skillLevel_idx" ON "User"("skillLevel");

-- CreateIndex
CREATE INDEX "Event_userId_idx" ON "Event"("userId");

-- CreateIndex
CREATE INDEX "Event_regionId_idx" ON "Event"("regionId");

-- CreateIndex
CREATE INDEX "LogEntry_isPrivate_idx" ON "LogEntry"("isPrivate");

-- CreateIndex
CREATE INDEX "LogEntry_user_id_idx" ON "LogEntry"("user_id");

-- CreateIndex
CREATE INDEX "LogEntry_date_idx" ON "LogEntry"("date");

-- CreateIndex
CREATE INDEX "LogEntry_beachId_idx" ON "LogEntry"("beachId");

-- CreateIndex
CREATE INDEX "LogEntry_surferRating_idx" ON "LogEntry"("surferRating");

-- CreateIndex
CREATE INDEX "SafariBooking_safariId_idx" ON "SafariBooking"("safariId");

-- CreateIndex
CREATE INDEX "SafariBooking_userId_idx" ON "SafariBooking"("userId");

-- CreateIndex
CREATE INDEX "SafariBooking_date_idx" ON "SafariBooking"("date");

-- CreateIndex
CREATE INDEX "SafariBooking_status_idx" ON "SafariBooking"("status");

-- CreateIndex
CREATE INDEX "SafariBooking_boardId_idx" ON "SafariBooking"("boardId");

-- CreateIndex
CREATE INDEX "SurfSafariListing_guideId_idx" ON "SurfSafariListing"("guideId");

-- CreateIndex
CREATE INDEX "SurfSafariListing_isActive_idx" ON "SurfSafariListing"("isActive");

-- CreateIndex
CREATE INDEX "BeachSafariConnection_safariId_idx" ON "BeachSafariConnection"("safariId");

-- CreateIndex
CREATE INDEX "BeachSafariConnection_beachId_idx" ON "BeachSafariConnection"("beachId");

-- CreateIndex
CREATE UNIQUE INDEX "BeachSafariConnection_beachId_safariId_key" ON "BeachSafariConnection"("beachId", "safariId");

-- CreateIndex
CREATE INDEX "Beach_regionId_idx" ON "Beach"("regionId");

-- CreateIndex
CREATE INDEX "Beach_country_idx" ON "Beach"("country");

-- CreateIndex
CREATE INDEX "Beach_waveType_idx" ON "Beach"("waveType");

-- CreateIndex
CREATE INDEX "Beach_difficulty_idx" ON "Beach"("difficulty");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_key" ON "Membership"("userId");

-- CreateIndex
CREATE INDEX "Board_userId_idx" ON "Board"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastA_date_region_key" ON "ForecastA"("date", "region");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastB_date_region_key" ON "ForecastB"("date", "region");

-- CreateIndex
CREATE INDEX "Story_authorId_idx" ON "Story"("authorId");

-- CreateIndex
CREATE INDEX "Story_beachId_idx" ON "Story"("beachId");

-- CreateIndex
CREATE INDEX "Story_regionId_idx" ON "Story"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFilters_userEmail_key" ON "UserFilters"("userEmail");

-- CreateIndex
CREATE UNIQUE INDEX "UserFilters_userId_key" ON "UserFilters"("userId");

-- CreateIndex
CREATE INDEX "UserFilters_userId_idx" ON "UserFilters"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_userId_idx" ON "UserFavorite"("userId");

-- CreateIndex
CREATE INDEX "UserFavorite_createdAt_idx" ON "UserFavorite"("createdAt");

-- CreateIndex
CREATE INDEX "RentalItem_userId_idx" ON "RentalItem"("userId");

-- CreateIndex
CREATE INDEX "RentalItem_itemType_idx" ON "RentalItem"("itemType");

-- CreateIndex
CREATE INDEX "RentalItem_isActive_idx" ON "RentalItem"("isActive");

-- CreateIndex
CREATE INDEX "BeachRentalConnection_rentalItemId_idx" ON "BeachRentalConnection"("rentalItemId");

-- CreateIndex
CREATE INDEX "BeachRentalConnection_beachId_idx" ON "BeachRentalConnection"("beachId");

-- CreateIndex
CREATE UNIQUE INDEX "BeachRentalConnection_rentalItemId_beachId_key" ON "BeachRentalConnection"("rentalItemId", "beachId");

-- CreateIndex
CREATE INDEX "RentalItemRequest_rentalItemId_idx" ON "RentalItemRequest"("rentalItemId");

-- CreateIndex
CREATE INDEX "RentalItemRequest_renterId_idx" ON "RentalItemRequest"("renterId");

-- CreateIndex
CREATE INDEX "RentalItemRequest_ownerId_idx" ON "RentalItemRequest"("ownerId");

-- CreateIndex
CREATE INDEX "RentalItemRequest_beachId_idx" ON "RentalItemRequest"("beachId");

-- CreateIndex
CREATE INDEX "RentalItemRequest_status_idx" ON "RentalItemRequest"("status");

-- CreateIndex
CREATE INDEX "RentalItemAvailability_rentalItemId_idx" ON "RentalItemAvailability"("rentalItemId");

-- CreateIndex
CREATE INDEX "RentalChatMessage_requestId_idx" ON "RentalChatMessage"("requestId");

-- CreateIndex
CREATE INDEX "RentalChatMessage_senderId_idx" ON "RentalChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "Comment_userId_idx" ON "Comment"("userId");

-- CreateIndex
CREATE INDEX "Comment_entityId_entityType_idx" ON "Comment"("entityId", "entityType");

-- AddForeignKey
ALTER TABLE "AdRequest" ADD CONSTRAINT "AdRequest_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdRequest" ADD CONSTRAINT "AdRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LogEntry" ADD CONSTRAINT "LogEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafariBooking" ADD CONSTRAINT "SafariBooking_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafariBooking" ADD CONSTRAINT "SafariBooking_safariId_fkey" FOREIGN KEY ("safariId") REFERENCES "SurfSafariListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafariBooking" ADD CONSTRAINT "SafariBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurfSafariListing" ADD CONSTRAINT "SurfSafariListing_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachSafariConnection" ADD CONSTRAINT "BeachSafariConnection_safariId_fkey" FOREIGN KEY ("safariId") REFERENCES "SurfSafariListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beach" ADD CONSTRAINT "Beach_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFilters" ADD CONSTRAINT "UserFilters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFavorite" ADD CONSTRAINT "UserFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItem" ADD CONSTRAINT "RentalItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachRentalConnection" ADD CONSTRAINT "BeachRentalConnection_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeachRentalConnection" ADD CONSTRAINT "BeachRentalConnection_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemRequest" ADD CONSTRAINT "RentalItemRequest_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemRequest" ADD CONSTRAINT "RentalItemRequest_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemRequest" ADD CONSTRAINT "RentalItemRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemRequest" ADD CONSTRAINT "RentalItemRequest_beachId_fkey" FOREIGN KEY ("beachId") REFERENCES "Beach"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalItemAvailability" ADD CONSTRAINT "RentalItemAvailability_rentalItemId_fkey" FOREIGN KEY ("rentalItemId") REFERENCES "RentalItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalChatMessage" ADD CONSTRAINT "RentalChatMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RentalItemRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalChatMessage" ADD CONSTRAINT "RentalChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
