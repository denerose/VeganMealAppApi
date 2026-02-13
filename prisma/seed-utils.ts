/**
 * Seed Utility Functions
 *
 * Purpose: Provide helper functions for deterministic UUID generation, logging,
 * idempotency checks, and error handling used by the seed script.
 *
 * Exports:
 * - deterministicUuid(seed): Generate consistent UUID v5 from string seed
 * - log(message, level): Log with timestamp and prefix
 * - logVerbose(message): Log only when SEED_VERBOSE=true
 * - checkIdempotency(prisma, tenantId): Check if seed data already exists
 * - seedDatabase(prisma): Main orchestration function for seeding
 */

import { v5 as uuidv5 } from "uuid";
import type { PrismaClient } from "@prisma/client";
import {
  SEED_TENANTS,
  SEED_INGREDIENTS,
  SEED_MEALS,
  SEED_USER_SETTINGS,
  SYSTEM_USER_ID,
  deterministicUuid,
  getNextMonday,
  getDayOfWeek,
  getShortDay,
} from "./seed-data.js";

/**
 * Namespace UUID for deterministic v5 generation
 * Using a fixed namespace ensures consistent UUID generation from same seed strings
 */
const SEED_NAMESPACE = "550e8400-e29b-41d4-a716-446655440000";

/**
 * Re-export deterministicUuid from seed-data for convenience
 * The function is defined in seed-data.ts to avoid circular imports
 */
export { deterministicUuid };

/**
 * Log a message with timestamp and optional level prefix
 *
 * @param message - Message to log
 * @param level - Log level ('info' | 'error', default: 'info')
 *
 * Example:
 *   log("Database connected");              // [12:34:56] ✓ Database connected
 *   log("Invalid input", "error");          // [12:34:56] ❌ Invalid input
 */
export function log(
  message: string,
  level: "info" | "error" = "info"
): void {
  const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
  const prefix = level === "error" ? "❌" : "✓";
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Log a message only when SEED_VERBOSE environment variable is set to "true"
 * Used for detailed operation logs without cluttering normal output
 *
 * @param message - Message to log (only shown in verbose mode)
 *
 * Example (with SEED_VERBOSE=true):
 *   logVerbose("Creating ingredient: Tofu");  // [12:34:56] [VERBOSE] Creating ingredient: Tofu
 *
 * Example (without SEED_VERBOSE):
 *   logVerbose("Creating ingredient: Tofu");  // (no output)
 */
export function logVerbose(message: string): void {
  if (process.env.SEED_VERBOSE === "true") {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(`[${timestamp}] [VERBOSE] ${message}`);
  }
}

/**
 * Check if seed data already exists in the database
 * Uses a marker meal ("Creamy Cashew Alfredo Pasta") to detect prior seeding
 *
 * This implements check-and-skip idempotency: if the marker meal exists,
 * the seed data was already created, so we skip seeding.
 *
 * @param prisma - PrismaClient instance
 * @param tenantId - Tenant ID to check within
 * @returns true if marker meal exists (seed already ran), false otherwise
 *
 * Example:
 *   const exists = await checkIdempotency(prisma, tenantId);
 *   if (exists) {
 *     console.log("Seed data already exists, skipping...");
 *     return;
 *   }
 */
export async function checkIdempotency(
  prisma: PrismaClient,
  tenantId: string
): Promise<boolean> {
  try {
    const markerMeal = await prisma.meal.findFirst({
      where: {
        mealName: "Creamy Cashew Alfredo Pasta",
        tenantId,
      },
    });
    return !!markerMeal;
  } catch (error) {
    logVerbose(`Idempotency check error: ${String(error)}`);
    return false;
  }
}

/**
 * Result type for seedDatabase function
 */
export interface SeedResult {
  mealsCreated: number;
  ingredientsCreated: number;
  tenantsCreated: number;
  userSettingsCreated: number;
  plannedWeeksCreated: number;
  dayPlansCreated: number;
}

/**
 * Create a system user for meal creation
 * All seeded meals are attributed to this system user
 */
async function ensureSystemUser(prisma: PrismaClient): Promise<string> {
  const defaultTenant = SEED_TENANTS[0];

  // Check if system user exists
  let user = await prisma.user.findFirst({
    where: { id: SYSTEM_USER_ID },
  });

  if (!user) {
    // Create system user
    user = await prisma.user.create({
      data: {
        id: SYSTEM_USER_ID,
        email: "system@seed.local",
        nickname: "System",
        tenantId: defaultTenant.id,
        isTenantAdmin: false,
      },
    });
    logVerbose(`Created system user: ${SYSTEM_USER_ID}`);
  }

  return user.id;
}

/**
 * Main seed orchestration function
 * Coordinates the creation of all seed data with proper ordering and error handling
 *
 * Seeding Order:
 * 1. Create tenants
 * 2. Create system user (meal creator)
 * 3. Create ingredients (per tenant)
 * 4. Create meals with qualities (per tenant)
 * 5. Create meal-ingredient relationships
 * 6. Create user settings (per tenant)
 * 7. Create planned weeks (per tenant)
 *
 * Idempotency:
 * - Checks for marker meal before seeding
 * - If marker exists, skips seeding (safe for re-runs)
 * - If marker doesn't exist, proceeds with seeding
 *
 * @param prisma - PrismaClient instance
 * @returns SeedResult with counts of created records
 */
export async function seedDatabase(prisma: PrismaClient): Promise<SeedResult> {
  const result: SeedResult = {
    mealsCreated: 0,
    ingredientsCreated: 0,
    tenantsCreated: 0,
    userSettingsCreated: 0,
    plannedWeeksCreated: 0,
    dayPlansCreated: 0,
  };

  // Check idempotency for first tenant
  const firstTenantId = SEED_TENANTS[0].id;
  const alreadySeeded = await checkIdempotency(prisma, firstTenantId);

  if (alreadySeeded) {
    log("Seed data already exists, skipping seeding");
    return result;
  }

  log("Starting seed process...");

  try {
    // 1. Create tenants
    logVerbose("Creating tenants...");
    for (const tenant of SEED_TENANTS) {
      await prisma.tenant.upsert({
        where: { id: tenant.id },
        update: {},
        create: {
          id: tenant.id,
          name: tenant.name,
        },
      });
      result.tenantsCreated++;
      logVerbose(`  Created tenant: ${tenant.name}`);
    }

    // 2. Create system user
    logVerbose("Ensuring system user exists...");
    const systemUserId = await ensureSystemUser(prisma);

    // 3-5. For each tenant: create ingredients, meals, and relationships (US2: tenant-scoped; no shared data)
    for (const tenant of SEED_TENANTS) {
      // Create ingredients (15 per tenant; each receives tenantId; 30 total, no shared ingredients)
      logVerbose(`Creating ingredients for tenant ${tenant.id}...`);
      const ingredientMap: Record<string, string> = {};

      for (const ingredientData of SEED_INGREDIENTS) {
        const ingredient = await prisma.ingredient.upsert({
          where: {
            tenantId_ingredientName: {
              tenantId: tenant.id,
              ingredientName: ingredientData.name,
            },
          },
          update: {},
          create: {
            id: deterministicUuid(`${tenant.id}-${ingredientData.name}`),
            ingredientName: ingredientData.name,
            storageType: ingredientData.storageType,
            staple: ingredientData.staple,
            tenantId: tenant.id,
          },
        });
        ingredientMap[ingredientData.name] = ingredient.id;
        result.ingredientsCreated++;
        logVerbose(`    Created ingredient: ${ingredientData.name}`);
      }

      // Create meals with qualities (10 per tenant; each receives tenantId; no shared meals across tenants)
      logVerbose(`Creating meals for tenant ${tenant.id}...`);
      for (const mealData of SEED_MEALS) {
        const meal = await prisma.meal.create({
          data: {
            id: deterministicUuid(`${tenant.id}-${mealData.mealName}`),
            mealName: mealData.mealName,
            recipeLink: mealData.recipeLink,
            mealImageId: mealData.mealImageId,
            tenantId: tenant.id,
            createdBy: systemUserId,
            qualities: {
              create: {
                isDinner: mealData.qualities.isDinner,
                isLunch: mealData.qualities.isLunch,
                isCreamy: mealData.qualities.isCreamy,
                isAcidic: mealData.qualities.isAcidic,
                greenVeg: mealData.qualities.greenVeg,
                makesLunch: mealData.qualities.makesLunch,
                isEasyToMake: mealData.qualities.isEasyToMake,
                needsPrep: mealData.qualities.needsPrep,
              },
            },
          },
        });
        result.mealsCreated++;
        logVerbose(`    Created meal: ${mealData.mealName}`);

        // Link ingredients to meal
        for (const ingredientName of mealData.ingredients) {
          const ingredientId = ingredientMap[ingredientName];
          if (ingredientId) {
            await prisma.mealIngredient.create({
              data: {
                id: deterministicUuid(`${meal.id}-${ingredientName}`),
                mealId: meal.id,
                ingredientId: ingredientId,
              },
            });
            logVerbose(`      Linked ingredient: ${ingredientName}`);
          }
        }
      }

      // 6. Create user settings
      logVerbose(`Creating user settings for tenant ${tenant.id}...`);
      const settingsData = SEED_USER_SETTINGS.find(
        (s) => s.tenantId === tenant.id
      );

      if (settingsData) {
        await prisma.userSettings.upsert({
          where: { tenantId: tenant.id },
          update: {},
          create: {
            id: deterministicUuid(`${tenant.id}-settings`),
            tenantId: tenant.id,
            weekStartDay: settingsData.weekStartDay,
            dailyPreferences: settingsData.dailyPreferences,
          },
        });
        result.userSettingsCreated++;
        logVerbose(
          `    Created user settings: weekStartDay=${settingsData.weekStartDay}`
        );
      }

      // 7. Create planned weeks with day plans (50% meal coverage)
      logVerbose(`Creating planned weeks for tenant ${tenant.id}...`);

      // Get meals for this tenant
      const allMeals = await prisma.meal.findMany({
        where: { tenantId: tenant.id },
      });

      // Calculate meal assignments (50% coverage = ~7 meals across 14 slots)
      const mealIds = allMeals.map((m) => m.id);
      const assignmentIndices = [0, 2, 4, 6, 7, 10, 12]; // 7 assignments across 14 slots

      // Create 2 planned weeks
      let week1Start = getNextMonday();
      for (let weekNum = 0; weekNum < 2; weekNum++) {
        const weekStart = new Date(week1Start);
        weekStart.setDate(weekStart.getDate() + weekNum * 7);

        const plannedWeek = await prisma.plannedWeek.create({
          data: {
            id: deterministicUuid(`${tenant.id}-week-${weekNum + 1}`),
            startingDate: weekStart,
            tenantId: tenant.id,
          },
        });
        result.plannedWeeksCreated++;
        logVerbose(
          `    Created planned week: ${weekStart.toISOString().split("T")[0]}`
        );

        // Create 7 day plans for this week
        for (let dayNum = 0; dayNum < 7; dayNum++) {
          const dayDate = new Date(weekStart);
          dayDate.setDate(dayDate.getDate() + dayNum);

          const shouldAssignMeal = assignmentIndices.includes(dayNum);
          const mealAssignmentIndex = assignmentIndices.indexOf(dayNum);
          const mealId = shouldAssignMeal
            ? mealIds[mealAssignmentIndex % mealIds.length]
            : null;

          const dayPlan = await prisma.dayPlan.create({
            data: {
              id: deterministicUuid(
                `${tenant.id}-day-${weekNum}-${dayNum}`
              ),
              date: dayDate,
              longDay: getDayOfWeek(dayDate) as any,
              shortDay: getShortDay(dayDate) as any,
              plannedWeekId: plannedWeek.id,
              dinnerMealId: mealId,
            },
          });
          result.dayPlansCreated++;
          logVerbose(
            `      Created day plan: ${dayDate.toISOString().split("T")[0]}`
          );
        }
      }
    }

    log(
      `Seeding completed: ${result.mealsCreated} meals, ${result.ingredientsCreated} ingredients, ${result.tenantsCreated} tenants`
    );
  } catch (error) {
    log(`Error during seeding: ${String(error)}`, "error");
    throw error;
  }

  return result;
}
