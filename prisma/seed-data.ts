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

import { v5 as uuidv5 } from "uuid";
import { StorageType } from "../src/domain/shared/storage-type.enum";

/**
 * Namespace UUID for deterministic v5 generation
 */
const SEED_NAMESPACE = "550e8400-e29b-41d4-a716-446655440000";

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
    id: deterministicUuid("Tenant-1"),
    name: "Test Tenant 1",
  },
  {
    id: deterministicUuid("Tenant-2"),
    name: "Test Tenant 2",
  },
];

/**
 * System user (creator of meals) - same for all tenants
 */
export const SYSTEM_USER_ID = deterministicUuid("System-User");

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
  { name: "Tofu", storageType: StorageType.FRIDGE, staple: true },
  { name: "Tempeh", storageType: StorageType.FRIDGE, staple: true },
  { name: "Fresh Spinach", storageType: StorageType.FRIDGE, staple: false },
  { name: "Coconut Milk", storageType: StorageType.FRIDGE, staple: true },

  // PANTRY (6)
  { name: "Pasta", storageType: StorageType.PANTRY, staple: true },
  { name: "Rice", storageType: StorageType.PANTRY, staple: true },
  { name: "Olive Oil", storageType: StorageType.PANTRY, staple: true },
  { name: "Garlic", storageType: StorageType.PANTRY, staple: true },
  { name: "Onion", storageType: StorageType.PANTRY, staple: false },
  { name: "Canned Tomatoes", storageType: StorageType.PANTRY, staple: true },

  // FROZEN (3)
  { name: "Frozen Broccoli", storageType: StorageType.FROZEN, staple: false },
  { name: "Frozen Peas", storageType: StorageType.FROZEN, staple: false },
  { name: "Frozen Spinach", storageType: StorageType.FROZEN, staple: false },

  // OTHER (2)
  { name: "Nutritional Yeast", storageType: StorageType.OTHER, staple: true },
  { name: "Cashew Butter", storageType: StorageType.OTHER, staple: false },
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
    mealName: "Creamy Cashew Alfredo Pasta",
    recipeLink: "https://example.com/cashew-alfredo",
    mealImageId: "img-001",
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
    ingredients: ["Pasta", "Cashew Butter", "Garlic", "Fresh Spinach", "Olive Oil"],
  },
  {
    mealName: "Lentil Bolognese",
    recipeLink: "https://example.com/lentil-bolognese",
    mealImageId: "img-002",
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
    ingredients: ["Pasta", "Canned Tomatoes", "Onion", "Garlic", "Olive Oil"],
  },
  {
    mealName: "Tofu Stir-Fry",
    recipeLink: "https://example.com/tofu-stir-fry",
    mealImageId: "img-003",
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
    ingredients: ["Tofu", "Rice", "Frozen Broccoli", "Garlic", "Olive Oil"],
  },
  {
    mealName: "Tempeh Buddha Bowl",
    recipeLink: "https://example.com/tempeh-buddha",
    mealImageId: "img-004",
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
    ingredients: ["Tempeh", "Rice", "Fresh Spinach", "Frozen Peas", "Nutritional Yeast"],
  },
  {
    mealName: "Creamy Tomato Soup",
    recipeLink: "https://example.com/creamy-tomato-soup",
    mealImageId: "img-005",
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
    ingredients: ["Canned Tomatoes", "Coconut Milk", "Onion", "Garlic", "Olive Oil"],
  },
  {
    mealName: "Garlic Rice with Greens",
    recipeLink: "https://example.com/garlic-rice-greens",
    mealImageId: "img-006",
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
    ingredients: ["Rice", "Frozen Spinach", "Garlic", "Olive Oil", "Nutritional Yeast"],
  },
  {
    mealName: "Crispy Tofu & Vegetables",
    recipeLink: "https://example.com/crispy-tofu",
    mealImageId: "img-007",
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
    ingredients: ["Tofu", "Frozen Broccoli", "Olive Oil", "Garlic", "Onion"],
  },
  {
    mealName: "Pea & Coconut Curry",
    recipeLink: "https://example.com/pea-curry",
    mealImageId: "img-008",
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
    ingredients: ["Frozen Peas", "Coconut Milk", "Rice", "Garlic", "Onion"],
  },
  {
    mealName: "Spinach & Mushroom Pasta",
    recipeLink: "https://example.com/spinach-pasta",
    mealImageId: "img-009",
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
    ingredients: ["Pasta", "Frozen Spinach", "Coconut Milk", "Garlic", "Olive Oil"],
  },
  {
    mealName: "Tempeh Tacos",
    recipeLink: "https://example.com/tempeh-tacos",
    mealImageId: "img-010",
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
    ingredients: ["Tempeh", "Onion", "Garlic", "Fresh Spinach", "Nutritional Yeast"],
  },
];

/**
 * User settings seed data (per-tenant)
 *
 * Includes:
 * - weekStartDay: Start day for planned weeks
 * - dailyPreferences: Per-day quality preferences (7 days)
 */
export const SEED_USER_SETTINGS = [
  {
    tenantId: SEED_TENANTS[0].id,
    weekStartDay: "MONDAY" as const,
    dailyPreferences: {
      MONDAY: { creamy: 0.3, acidic: 0.2, greenVeg: 0.5, easy: 0.4 },
      TUESDAY: { creamy: 0.2, acidic: 0.3, greenVeg: 0.4, easy: 0.5 },
      WEDNESDAY: { creamy: 0.4, acidic: 0.1, greenVeg: 0.6, easy: 0.3 },
      THURSDAY: { creamy: 0.5, acidic: 0.2, greenVeg: 0.3, easy: 0.6 },
      FRIDAY: { creamy: 0.3, acidic: 0.4, greenVeg: 0.5, easy: 0.2 },
      SATURDAY: { creamy: 0.6, acidic: 0.1, greenVeg: 0.4, easy: 0.1 },
      SUNDAY: { creamy: 0.5, acidic: 0.3, greenVeg: 0.5, easy: 0.4 },
    },
  },
  {
    tenantId: SEED_TENANTS[1].id,
    weekStartDay: "SUNDAY" as const,
    dailyPreferences: {
      SUNDAY: { creamy: 0.4, acidic: 0.3, greenVeg: 0.6, easy: 0.3 },
      MONDAY: { creamy: 0.2, acidic: 0.5, greenVeg: 0.3, easy: 0.6 },
      TUESDAY: { creamy: 0.5, acidic: 0.2, greenVeg: 0.4, easy: 0.2 },
      WEDNESDAY: { creamy: 0.3, acidic: 0.4, greenVeg: 0.5, easy: 0.5 },
      THURSDAY: { creamy: 0.6, acidic: 0.1, greenVeg: 0.5, easy: 0.3 },
      FRIDAY: { creamy: 0.4, acidic: 0.3, greenVeg: 0.6, easy: 0.4 },
      SATURDAY: { creamy: 0.5, acidic: 0.2, greenVeg: 0.4, easy: 0.2 },
    },
  },
];

/**
 * Calculate next Monday from a given date
 */
export function getNextMonday(fromDate: Date = new Date()): Date {
  const date = new Date(fromDate);
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : (8 - day) % 7 || 7;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

/**
 * Get day of week name from date
 */
export function getDayOfWeek(date: Date): keyof typeof DayOfWeekMap {
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"] as const;
  return days[date.getDay()];
}

/**
 * Get short day abbreviation
 */
export function getShortDay(date: Date): string {
  const shortDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return shortDays[date.getDay()];
}

/**
 * Day of week mapping for Prisma enum
 */
export const DayOfWeekMap = {
  SUNDAY: "SUNDAY",
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
} as const;

/**
 * Short day mapping for Prisma enum
 */
export const ShortDayMap = {
  SUN: "SUN",
  MON: "MON",
  TUE: "TUE",
  WED: "WED",
  THU: "THU",
  FRI: "FRI",
  SAT: "SAT",
} as const;
