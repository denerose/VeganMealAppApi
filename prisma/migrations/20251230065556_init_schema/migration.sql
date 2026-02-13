-- CreateEnum
CREATE TYPE "WeekStartDay" AS ENUM ('MONDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "ShortDay" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('FRIDGE', 'PANTRY', 'FROZEN', 'OTHER');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "isTenantAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL,
    "weekStartDay" "WeekStartDay" NOT NULL DEFAULT 'MONDAY',
    "dailyPreferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_weeks" (
    "id" TEXT NOT NULL,
    "startingDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "planned_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_plans" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "longDay" "DayOfWeek" NOT NULL,
    "shortDay" "ShortDay" NOT NULL,
    "isLeftover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plannedWeekId" TEXT NOT NULL,
    "lunchMealId" TEXT,
    "dinnerMealId" TEXT,

    CONSTRAINT "day_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" TEXT NOT NULL,
    "mealName" TEXT NOT NULL,
    "recipeLink" TEXT,
    "mealImageId" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_qualities" (
    "id" TEXT NOT NULL,
    "isDinner" BOOLEAN NOT NULL DEFAULT true,
    "isLunch" BOOLEAN NOT NULL DEFAULT false,
    "isCreamy" BOOLEAN NOT NULL DEFAULT false,
    "isAcidic" BOOLEAN NOT NULL DEFAULT false,
    "greenVeg" BOOLEAN NOT NULL DEFAULT false,
    "makesLunch" BOOLEAN NOT NULL DEFAULT false,
    "isEasyToMake" BOOLEAN NOT NULL DEFAULT false,
    "needsPrep" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mealId" TEXT NOT NULL,

    CONSTRAINT "meal_qualities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "ingredientName" TEXT NOT NULL,
    "staple" BOOLEAN NOT NULL DEFAULT false,
    "storageType" "StorageType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ingredients" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,

    CONSTRAINT "meal_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_tenantId_key" ON "user_settings"("tenantId");

-- CreateIndex
CREATE INDEX "planned_weeks_tenantId_idx" ON "planned_weeks"("tenantId");

-- CreateIndex
CREATE INDEX "planned_weeks_tenantId_startingDate_idx" ON "planned_weeks"("tenantId", "startingDate");

-- CreateIndex
CREATE INDEX "day_plans_plannedWeekId_idx" ON "day_plans"("plannedWeekId");

-- CreateIndex
CREATE INDEX "day_plans_date_idx" ON "day_plans"("date");

-- CreateIndex
CREATE INDEX "meals_tenantId_idx" ON "meals"("tenantId");

-- CreateIndex
CREATE INDEX "meals_tenantId_isArchived_idx" ON "meals"("tenantId", "isArchived");

-- CreateIndex
CREATE INDEX "meals_createdBy_idx" ON "meals"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "meal_qualities_mealId_key" ON "meal_qualities"("mealId");

-- CreateIndex
CREATE INDEX "ingredients_tenantId_idx" ON "ingredients"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_tenantId_ingredientName_key" ON "ingredients"("tenantId", "ingredientName");

-- CreateIndex
CREATE INDEX "meal_ingredients_mealId_idx" ON "meal_ingredients"("mealId");

-- CreateIndex
CREATE INDEX "meal_ingredients_ingredientId_idx" ON "meal_ingredients"("ingredientId");

-- CreateIndex
CREATE UNIQUE INDEX "meal_ingredients_mealId_ingredientId_key" ON "meal_ingredients"("mealId", "ingredientId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_weeks" ADD CONSTRAINT "planned_weeks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_plannedWeekId_fkey" FOREIGN KEY ("plannedWeekId") REFERENCES "planned_weeks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_lunchMealId_fkey" FOREIGN KEY ("lunchMealId") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "day_plans" ADD CONSTRAINT "day_plans_dinnerMealId_fkey" FOREIGN KEY ("dinnerMealId") REFERENCES "meals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_qualities" ADD CONSTRAINT "meal_qualities_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
