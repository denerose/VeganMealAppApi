/**
 * Seed Data Definitions
 *
 * Purpose: Define hardcoded seed data for all entities
 * - Tenants (2 test tenants with deterministic UUIDs)
 * - Ingredients (15 vegan ingredients per tenant)
 * - Meals (10 vegan meals per tenant with quality flags)
 * - User Settings (per-tenant preferences)
 * - Planned Weeks (2 weeks per tenant with 50% meal coverage)
 *
 * All data is deterministic (same input = same output) and vegan-aligned.
 */

import { v5 as uuidv5 } from 'uuid';
import { DayOfWeek } from '../src/domain/shared/day-of-week.enum';
import { ShortDay } from '../src/domain/shared/short-day.enum';
import { WeekStartDay } from '../src/domain/shared/week-start-day.enum';
import { DAY_INDEX_TO_DAY_OF_WEEK } from '../src/domain/shared/day-of-week.enum';
import { DAY_INDEX_TO_SHORT_DAY } from '../src/domain/shared/short-day.enum';
import { WEEK_START_DAY_INDEX } from '../src/domain/shared/week-start-day.enum';
import { StorageType } from '../src/domain/shared/storage-type.enum';

/**
 * Namespace UUID for deterministic v5 generation
 */
const SEED_NAMESPACE = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Generate a deterministic UUID v5 from a seed string
 * Same input always produces the same UUID (reproducible across runs)
 */
export function deterministicUuid(seed: string): string {
  return uuidv5(seed, SEED_NAMESPACE);
}

/**
 * Tenant definitions with deterministic UUIDs
 */
export const SEED_TENANTS = [
  {
    id: deterministicUuid('Tenant-1'),
    name: 'Test Tenant 1',
  },
  {
    id: deterministicUuid('Tenant-2'),
    name: 'Test Tenant 2',
  },
];

/**
 * Returns the deterministic system user ID for a tenant (used as meal creator in seed).
 * One per tenant for tenant isolation.
 *
 * @param tenantId - Tenant UUID
 * @returns Deterministic UUID for the system user
 */
export function getSystemUserIdForTenant(tenantId: string): string {
  return deterministicUuid(`System-User-${tenantId}`);
}

/**
 * Shared password for all seed dev users (dev/testing only).
 * Documented in docs/SEEDING-GUIDE.md; do not use in production.
 */
export const SEED_DEV_USER_PASSWORD = 'DevPassword1!';

/**
 * Seed dev users: 2 for Tenant-1 (one admin, one regular), 1 for Tenant-2 (admin).
 * Used for local sign-in and multi-tenant testing; skip-if-exists by email.
 */
export const SEED_DEV_USERS = [
  {
    id: deterministicUuid('Seed-Dev-Tenant1-Admin'),
    email: 'dev-tenant1-admin@seed.local',
    nickname: 'Dev Tenant1 Admin',
    tenantId: SEED_TENANTS[0].id,
    isTenantAdmin: true,
  },
  {
    id: deterministicUuid('Seed-Dev-Tenant1-User'),
    email: 'dev-tenant1-user@seed.local',
    nickname: 'Dev Tenant1 User',
    tenantId: SEED_TENANTS[0].id,
    isTenantAdmin: false,
  },
  {
    id: deterministicUuid('Seed-Dev-Tenant2-Admin'),
    email: 'dev-tenant2-admin@seed.local',
    nickname: 'Dev Tenant2 Admin',
    tenantId: SEED_TENANTS[1].id,
    isTenantAdmin: true,
  },
];

/**
 * Ingredient seed data (15 vegan ingredients per tenant)
 *
 * Distribution:
 * - 4 FRIDGE items (fresh vegetables, plant-based proteins)
 * - 6 PANTRY items (dry goods, staples)
 * - 3 FROZEN items (frozen vegetables, plant-based proteins)
 * - 2 OTHER items (specialty items)
 */
export const SEED_INGREDIENTS = [
  // FRIDGE (4)
  { name: 'Tofu', storageType: StorageType.FRIDGE, staple: true },
  { name: 'Tempeh', storageType: StorageType.FRIDGE, staple: true },
  { name: 'Fresh Spinach', storageType: StorageType.FRIDGE, staple: false },
  { name: 'Coconut Milk', storageType: StorageType.FRIDGE, staple: true },

  // PANTRY (6)
  { name: 'Pasta', storageType: StorageType.PANTRY, staple: true },
  { name: 'Rice', storageType: StorageType.PANTRY, staple: true },
  { name: 'Olive Oil', storageType: StorageType.PANTRY, staple: true },
  { name: 'Garlic', storageType: StorageType.PANTRY, staple: true },
  { name: 'Onion', storageType: StorageType.PANTRY, staple: false },
  { name: 'Canned Tomatoes', storageType: StorageType.PANTRY, staple: true },

  // FROZEN (3)
  { name: 'Frozen Broccoli', storageType: StorageType.FROZEN, staple: false },
  { name: 'Frozen Peas', storageType: StorageType.FROZEN, staple: false },
  { name: 'Frozen Spinach', storageType: StorageType.FROZEN, staple: false },

  // OTHER (2)
  { name: 'Nutritional Yeast', storageType: StorageType.OTHER, staple: true },
  { name: 'Cashew Butter', storageType: StorageType.OTHER, staple: false },
];

/**
 * Meal seed data (10 vegan meals per tenant)
 *
 * Each meal includes:
 * - mealName: Recipe name
 * - recipeLink: Optional URL (placeholder for dev)
 * - mealImageId: Placeholder image ID
 * - qualities: Quality flags for filtering
 * - ingredients: Ingredient names to link
 */
export const SEED_MEALS = [
  {
    mealName: 'Creamy Cashew Alfredo Pasta',
    recipeLink: 'https://example.com/cashew-alfredo',
    mealImageId: 'img-001',
    qualities: {
      isDinner: true,
      isLunch: false,
      isCreamy: true,
      isAcidic: false,
      greenVeg: true,
      makesLunch: true,
      isEasyToMake: false,
      needsPrep: true,
    },
    ingredients: ['Pasta', 'Cashew Butter', 'Garlic', 'Fresh Spinach', 'Olive Oil'],
  },
  {
    mealName: 'Lentil Bolognese',
    recipeLink: 'https://example.com/lentil-bolognese',
    mealImageId: 'img-002',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: false,
      isAcidic: true,
      greenVeg: false,
      makesLunch: true,
      isEasyToMake: true,
      needsPrep: false,
    },
    ingredients: ['Pasta', 'Canned Tomatoes', 'Onion', 'Garlic', 'Olive Oil'],
  },
  {
    mealName: 'Tofu Stir-Fry',
    recipeLink: 'https://example.com/tofu-stir-fry',
    mealImageId: 'img-003',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: false,
      isAcidic: false,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: true,
    },
    ingredients: ['Tofu', 'Rice', 'Frozen Broccoli', 'Garlic', 'Olive Oil'],
  },
  {
    mealName: 'Tempeh Buddha Bowl',
    recipeLink: 'https://example.com/tempeh-buddha',
    mealImageId: 'img-004',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: false,
      isAcidic: false,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: true,
    },
    ingredients: ['Tempeh', 'Rice', 'Fresh Spinach', 'Frozen Peas', 'Nutritional Yeast'],
  },
  {
    mealName: 'Creamy Tomato Soup',
    recipeLink: 'https://example.com/creamy-tomato-soup',
    mealImageId: 'img-005',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: true,
      isAcidic: true,
      greenVeg: false,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: false,
    },
    ingredients: ['Canned Tomatoes', 'Coconut Milk', 'Onion', 'Garlic', 'Olive Oil'],
  },
  {
    mealName: 'Garlic Rice with Greens',
    recipeLink: 'https://example.com/garlic-rice-greens',
    mealImageId: 'img-006',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: false,
      isAcidic: false,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: false,
    },
    ingredients: ['Rice', 'Frozen Spinach', 'Garlic', 'Olive Oil', 'Nutritional Yeast'],
  },
  {
    mealName: 'Crispy Tofu & Vegetables',
    recipeLink: 'https://example.com/crispy-tofu',
    mealImageId: 'img-007',
    qualities: {
      isDinner: true,
      isLunch: false,
      isCreamy: false,
      isAcidic: false,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: false,
      needsPrep: true,
    },
    ingredients: ['Tofu', 'Frozen Broccoli', 'Olive Oil', 'Garlic', 'Onion'],
  },
  {
    mealName: 'Pea & Coconut Curry',
    recipeLink: 'https://example.com/pea-curry',
    mealImageId: 'img-008',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: true,
      isAcidic: false,
      greenVeg: false,
      makesLunch: true,
      isEasyToMake: true,
      needsPrep: false,
    },
    ingredients: ['Frozen Peas', 'Coconut Milk', 'Rice', 'Garlic', 'Onion'],
  },
  {
    mealName: 'Spinach & Mushroom Pasta',
    recipeLink: 'https://example.com/spinach-pasta',
    mealImageId: 'img-009',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: true,
      isAcidic: false,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: true,
    },
    ingredients: ['Pasta', 'Frozen Spinach', 'Coconut Milk', 'Garlic', 'Olive Oil'],
  },
  {
    mealName: 'Tempeh Tacos',
    recipeLink: 'https://example.com/tempeh-tacos',
    mealImageId: 'img-010',
    qualities: {
      isDinner: true,
      isLunch: true,
      isCreamy: false,
      isAcidic: true,
      greenVeg: true,
      makesLunch: false,
      isEasyToMake: true,
      needsPrep: true,
    },
    ingredients: ['Tempeh', 'Onion', 'Garlic', 'Fresh Spinach', 'Nutritional Yeast'],
  },
];

/**
 * User settings seed data (per-tenant)
 *
 * Includes:
 * - weekStartDay: Start day for planned weeks
 * - dailyPreferences: Array of 7 entries (one per day) with boolean quality flags
 *   for GetEligibleMealsUseCase compatibility.
 */
export const SEED_USER_SETTINGS = [
  {
    tenantId: SEED_TENANTS[0].id,
    weekStartDay: WeekStartDay.MONDAY,
    dailyPreferences: [
      { day: DayOfWeek.MONDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: true, isEasyToMake: true } },
      { day: DayOfWeek.TUESDAY, preferences: { isCreamy: false, isAcidic: true, greenVeg: true, isEasyToMake: true } },
      { day: DayOfWeek.WEDNESDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: false, isEasyToMake: false } },
      { day: DayOfWeek.THURSDAY, preferences: { isCreamy: true, isAcidic: true, greenVeg: true, isEasyToMake: true } },
      { day: DayOfWeek.FRIDAY, preferences: { isCreamy: true, isAcidic: true, greenVeg: true, isEasyToMake: false } },
      { day: DayOfWeek.SATURDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: true, isEasyToMake: false } },
      { day: DayOfWeek.SUNDAY, preferences: { isCreamy: true, isAcidic: true, greenVeg: true, isEasyToMake: true } },
    ],
  },
  {
    tenantId: SEED_TENANTS[1].id,
    weekStartDay: WeekStartDay.SUNDAY,
    dailyPreferences: [
      { day: DayOfWeek.SUNDAY, preferences: { isCreamy: true, isAcidic: true, greenVeg: true, isEasyToMake: false } },
      { day: DayOfWeek.MONDAY, preferences: { isCreamy: false, isAcidic: true, greenVeg: false, isEasyToMake: true } },
      { day: DayOfWeek.TUESDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: true, isEasyToMake: false } },
      { day: DayOfWeek.WEDNESDAY, preferences: { isCreamy: false, isAcidic: true, greenVeg: true, isEasyToMake: true } },
      { day: DayOfWeek.THURSDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: true, isEasyToMake: false } },
      { day: DayOfWeek.FRIDAY, preferences: { isCreamy: true, isAcidic: true, greenVeg: true, isEasyToMake: true } },
      { day: DayOfWeek.SATURDAY, preferences: { isCreamy: true, isAcidic: false, greenVeg: true, isEasyToMake: false } },
    ],
  },
];

/**
 * Calculate the next occurrence of the given week start day from a date.
 * Used so each tenant's planned weeks start on their weekStartDay (e.g. Monday vs Sunday).
 *
 * @param fromDate - Reference date (default: today)
 * @param weekStartDay - WeekStartDay enum value
 * @returns Date of the start of the week (same day as weekStartDay, at start of day)
 */
export function getNextWeekStart(
  fromDate: Date = new Date(),
  weekStartDay: WeekStartDay
): Date {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  const current = date.getDay();
  const target = WEEK_START_DAY_INDEX[weekStartDay] ?? 1;
  const daysUntil = (target - current + 7) % 7;
  date.setDate(date.getDate() + (daysUntil === 0 ? 0 : daysUntil));
  return date;
}

/**
 * Calculate next Monday from a given date.
 *
 * @param fromDate - Reference date (default: today)
 * @returns Date of the next Monday (or today if today is Monday)
 */
export function getNextMonday(fromDate: Date = new Date()): Date {
  return getNextWeekStart(fromDate, WeekStartDay.MONDAY);
}

/**
 * Get day of week from a date (domain DayOfWeek enum).
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  return DAY_INDEX_TO_DAY_OF_WEEK[date.getDay()];
}

/**
 * Get short day abbreviation from a date (domain ShortDay enum).
 */
export function getShortDay(date: Date): ShortDay {
  return DAY_INDEX_TO_SHORT_DAY[date.getDay()];
}
